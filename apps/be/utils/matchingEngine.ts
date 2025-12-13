import { prisma } from "@repo/db";
import {
  broadcastPriceUpdate,
  broadcastOrderUpdate,
  broadcastPositionUpdate,
} from "@repo/ws";

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

// -----------------------------------------------------
// MAIN ENTRY: called from POST /prices/update
// -----------------------------------------------------
/**
 * Performs process price update operation.
 * @param {string} symbol - Description of symbol
 * @param {number} price - Description of price
 * @returns {Promise<void>} Description of return value
 */
export async function processPriceUpdate(symbol: string, price: number) {
  const currentPrice = BigInt(Math.round(price));

  const underlying = await prisma.underlying.findFirst({
    where: { symbol },
  });
  if (!underlying) return;

  broadcastPriceUpdate(symbol, price);

  const contracts = await prisma.optionContract.findMany({
    where: { underlyingId: underlying.id },
  });
  if (contracts.length === 0) return;

  const contractIds = contracts.map((c) => c.id);

  const orders = await prisma.order.findMany({
    where: {
      contractId: { in: contractIds },
      status: "PENDING",
    },
  });

  for (const order of orders) {
    const canFill = shouldFill({
      side: order.side,
      orderType: order.orderType,
      limitPrice: order.price,
      currentPrice,
    });

    if (!canFill) continue;

    await fillOrder(order, currentPrice);
  }
}

// -----------------------------------------------------
// FILL ORDER
// -----------------------------------------------------
/**
 * Performs fill order operation.
 * @param {any} order - Description of order
 * @param {bigint} fillPrice - Description of fillPrice
 * @returns {Promise<void>} Description of return value
 */
export async function fillOrder(order: any, fillPrice: bigint) {
  const remainingQty = order.qty - order.filledQty;
  if (remainingQty <= 0) return;

  // 1) Create trade
  const trade = await prisma.trade.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      price: fillPrice,
      qty: remainingQty,
      direction: order.side,
    },
  });

  // 2) Update order → FILLED
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      filledQty: order.qty,
      status: "FILLED",
    },
  });

  // 3) Update position via your service
  const updatedPosition = await updatePositionFromTrade({
    userId: order.userId,
    contractId: order.contractId,
    price: fillPrice,
    qty: remainingQty,
    direction: order.side,
  });

  // 4) Broadcast events
  broadcastOrderUpdate(order.userId, updatedOrder);
  broadcastPositionUpdate(order.userId, updatedPosition);

  console.log(
    `FILLED ${order.side} order ${order.id} @ ${fillPrice} x ${remainingQty}`,
  );
}

// -----------------------------------------------------
// SIMPLE MATCHING ENGINE (placeholder)
// -----------------------------------------------------
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
 * Naive matcher: currently acts as a no-op and leaves orders pending.
 * Keeps API stable while a real orderbook is implemented.
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
  return {
    fills: [],
    filledQty: 0,
    status: "PENDING",
  };
}
