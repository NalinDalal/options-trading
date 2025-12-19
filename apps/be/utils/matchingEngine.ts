// NOTE: Pure matching logic. No IO here.
import { prisma } from "@repo/db";
import { producer } from "@repo/kafka";
import { TOPICS } from "@repo/kafka/topics";

import { updatePositionFromTrade } from "../services/positions";

// ----------------------
// HELPER: shouldFill
// ----------------------
type FillCheckParams = {
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  limitPrice?: bigint | null;
  currentPrice: bigint;
};

/**
 * Performs should fill operation.
 * @param {FillCheckParams} {
 *   side,
 *   orderType,
 *   limitPrice,
 *   currentPrice,
 * } - Description of {
 *   side,
 *   orderType,
 *   limitPrice,
 *   currentPrice,
 * }
 * @returns {boolean} Description of return value
 */
function shouldFill({
  side,
  orderType,
  limitPrice,
  currentPrice,
}: FillCheckParams): boolean {
  if (orderType === "MARKET") return true;

  if (!limitPrice) return false;

  if (side === "BUY") return currentPrice <= limitPrice;
  if (side === "SELL") return currentPrice >= limitPrice;

  return false;
}

// ----------------------
// ORDER BOOK MANAGEMENT
// ----------------------

interface BookOrder {
  id: string;
  userId: string;
  price: bigint;
  qty: number;
  remainingQty: number;
  orderType: "MARKET" | "LIMIT";
  side: "BUY" | "SELL";
  createdAt: number;
}

/**
 * In-memory order books per contract
 */
const orderBooks: Record<
  string,
  {
    BUY: BookOrder[];
    SELL: BookOrder[];
  }
> = {};

/**
 * Initialize or get order book for a contract
 */
function getOrderBook(contractId: string) {
  if (!orderBooks[contractId]) {
    orderBooks[contractId] = { BUY: [], SELL: [] };
  }
  return orderBooks[contractId];
}

/**
 * Add order to the order book with proper price sorting
 */
function addToOrderBook(
  contractId: string,
  order: {
    id: string;
    userId: string;
    side: "BUY" | "SELL";
    price: bigint;
    qty: number;
    orderType: "MARKET" | "LIMIT";
  },
) {
  const book = getOrderBook(contractId);
  const side = order.side;

  const bookOrder: BookOrder = {
    id: order.id,
    userId: order.userId,
    price: order.price,
    qty: order.qty,
    remainingQty: order.qty,
    orderType: order.orderType,
    side: order.side,
    createdAt: Date.now(),
  };

  // For MARKET orders, keep them at high priority (front of array)
  if (order.orderType === "MARKET") {
    book[side].unshift(bookOrder);
  } else {
    // For LIMIT orders, insert at sorted position
    if (side === "BUY") {
      // Sort BUY orders by price DESC (highest first)
      let inserted = false;
      for (let i = 0; i < book.BUY.length; i++) {
        const existingOrder = book.BUY[i];
        if (existingOrder && order.price > existingOrder.price) {
          book.BUY.splice(i, 0, bookOrder);
          inserted = true;
          break;
        }
      }
      if (!inserted) book.BUY.push(bookOrder);
    } else {
      // Sort SELL orders by price ASC (lowest first)
      let inserted = false;
      for (let i = 0; i < book.SELL.length; i++) {
        const existingOrder = book.SELL[i];
        if (existingOrder && order.price < existingOrder.price) {
          book.SELL.splice(i, 0, bookOrder);
          inserted = true;
          break;
        }
      }
      if (!inserted) book.SELL.push(bookOrder);
    }
  }
}

/**
 * Remove fully filled order from book
 */
function removeFromOrderBook(contractId: string, orderId: string) {
  const book = getOrderBook(contractId);
  book.BUY = book.BUY.filter((o) => o.id !== orderId);
  book.SELL = book.SELL.filter((o) => o.id !== orderId);
}

// ----------------------
// MATCHING ENGINE
// ----------------------
type MatchResult = {
  fills: Array<{
    orderId: string;
    userId: string;
    price: bigint;
    qty: number;
    direction: "BUY" | "SELL";
  }>;
  filledQty: number;
  status: "PENDING" | "PARTIAL" | "FILLED";
};

/**
 * Matches an incoming order against existing orders in the book.
 * Returns fills for both the incoming order and matched counter-orders.
 */
export async function matchOrder(order: {
  id: string;
  userId: string;
  contractId: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  price: bigint | null;
  qty: number;
}): Promise<MatchResult> {
  const book = getOrderBook(order.contractId);
  const fills: MatchResult["fills"] = [];
  let filledQty = 0;

  // Determine which side of the book to match against
  const counterSide = order.side === "BUY" ? "SELL" : "BUY";
  const counterOrders = book[counterSide];

  // MARKET orders match at any price; LIMIT orders have price constraints
  const isMarket = order.orderType === "MARKET";
  const limitPrice = order.price ?? 0n;

  let remainingQty = order.qty;
  let i = 0;

  while (remainingQty > 0 && i < counterOrders.length) {
    const counterOrder = counterOrders[i];
    if (!counterOrder) break;

    // Check if price is acceptable
    let canMatch = false;
    if (isMarket) {
      canMatch = true; // MARKET orders match anything
    } else {
      // LIMIT order: BUY can match SELL at limitPrice or less, SELL can match BUY at limitPrice or more
      if (order.side === "BUY") {
        canMatch = limitPrice >= counterOrder.price;
      } else {
        canMatch = limitPrice <= counterOrder.price;
      }
    }

    if (!canMatch) break;

    // Calculate fill quantity
    const matchQty = Math.min(remainingQty, counterOrder.remainingQty);

    // Use the counter-order's price (the maker's price)
    const fillPrice = counterOrder.price;

    // Add fill for incoming order
    fills.push({
      orderId: order.id,
      userId: order.userId,
      price: fillPrice,
      qty: matchQty,
      direction: order.side,
    });

    // Add fill for counter-order
    fills.push({
      orderId: counterOrder.id,
      userId: counterOrder.userId,
      price: fillPrice,
      qty: matchQty,
      direction: counterOrder.side,
    });

    // Update quantities
    filledQty += matchQty;
    remainingQty -= matchQty;
    counterOrder.remainingQty -= matchQty;

    // Remove counter-order if fully filled
    if (counterOrder.remainingQty === 0) {
      removeFromOrderBook(order.contractId, counterOrder.id);
      counterOrders.splice(i, 1);
    } else {
      i++;
    }
  }

  // Add incoming order to book if not fully filled
  if (remainingQty > 0) {
    addToOrderBook(order.contractId, {
      id: order.id,
      userId: order.userId,
      side: order.side,
      price: order.price ?? 0n,
      qty: order.qty,
      orderType: order.orderType,
    });
  }

  // Determine final status
  let status: "PENDING" | "PARTIAL" | "FILLED";
  if (filledQty === order.qty) {
    status = "FILLED";
  } else if (filledQty > 0) {
    status = "PARTIAL";
  } else {
    status = "PENDING";
  }

  return {
    fills,
    filledQty,
    status,
  };
}

/**
 * Cancel an order and remove it from the order book
 */
export function cancelOrder(contractId: string, orderId: string) {
  removeFromOrderBook(contractId, orderId);
}

/**
 * Get current order book state (for debugging/monitoring)
 */
export function getOrderBookState(contractId: string) {
  const book = getOrderBook(contractId);
  return {
    buy: book.BUY.map((o) => ({
      id: o.id,
      userId: o.userId,
      price: o.price.toString(),
      qty: o.qty,
      remaining: o.remainingQty,
      type: o.orderType,
    })),
    sell: book.SELL.map((o) => ({
      id: o.id,
      userId: o.userId,
      price: o.price.toString(),
      qty: o.qty,
      remaining: o.remainingQty,
      type: o.orderType,
    })),
  };
}
