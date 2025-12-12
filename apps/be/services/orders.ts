import { prisma } from "@repo/db";
import { broadcastOrderUpdate } from "@repo/ws";
import { fillOrder } from "../utils/matchingEngine";

export type CreateOrderParams = {
  userId: string;
  contractId: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  price?: bigint | null;
  quantity: number;
};

/**
 * Create a new order
 * - Inserts into DB
 * - Broadcasts creation
 */
export async function createOrder(params: CreateOrderParams) {
  const { userId, contractId, side, orderType, price, quantity } = params;

  const order = await prisma.order.create({
    data: {
      userId,
      contractId,
      side,
      orderType,
      price: price ?? null,
      qty: quantity,
      filledQty: 0,
      status: "PENDING",
    },
  });

  // Broadcast order creation
  broadcastOrderUpdate(userId, order);

  return order;
}

/**
 * Cancel an existing order
 * - Only allows PENDING orders to be cancelled
 */
export async function cancelOrder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new Error("Order not found");
  if (order.userId !== userId) throw new Error("Unauthorized");
  if (order.status !== "PENDING")
    throw new Error("Cannot cancel filled/cancelled order");

  const cancelled = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  // Broadcast cancellation
  broadcastOrderUpdate(userId, cancelled);

  return cancelled;
}

/**
 * List orders for a user
 * - Optional filter by status
 */
export async function listOrders(userId: string, status?: string) {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

/**
 * Execute a market or limit order immediately
 * - Delegates to matching engine
 */
export async function executeOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // Use matching engine to fill the order at current price
  await fillOrder(order, order.price ?? 0n);

  return order;
}
