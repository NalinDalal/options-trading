import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import type { Route } from "../utils/router";
import { producer } from "@repo/kafka";
import { TOPICS } from "@repo/kafka/topics";

//import { matchOrder } from "../utils/matchingEngine";
//import { broadcast } from "@repo/ws";

export const orderRoutes: Route[] = [
  {
    method: "POST",
    path: "/orders",
    auth: true,
    handler: async (req, { userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);
      try {
        const body = await parseJSON(req);
        const { contractId, side, price, qty } = body || {};

        const isLimitOrder = price !== undefined && price !== null;

        if (!contractId || !side || !qty) {
          return json(
            {
              error: "Required: contractId, side, qty",
            },
            400,
          );
        }

        if (side !== "BUY" && side !== "SELL") {
          return json({ error: "side must be BUY or SELL" }, 400);
        }

        if (qty <= 0) {
          return json({ error: "qty must be positive" }, 400);
        }

        const contract = await prisma.optionContract.findUnique({
          where: { id: contractId },
        });
        if (!contract) return json({ error: "Invalid contractId" }, 404);

        const order = await prisma.order.create({
          data: {
            userId,
            contractId,
            side,
            orderType: isLimitOrder ? "LIMIT" : "MARKET",
            price: isLimitOrder ? BigInt(price) : null,
            qty,
          },
        });

        // Run matching engine
        const matchResult = await matchOrder(order);

        // Persist trades
        for (const fill of matchResult.fills) {
          await prisma.trade.create({
            data: {
              orderId: fill.orderId,
              userId: fill.userId,
              price: BigInt(fill.price),
              qty: fill.qty,
              direction: fill.direction,
            },
          });
        }

        // Update order status + filledQty
        await prisma.order.update({
          where: { id: order.id },
          data: {
            filledQty: matchResult.filledQty,
            status: matchResult.status,
          },
        });

        const finalOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { trades: true },
        });

        // Broadcast to user
        broadcast(`orders:${userId}`, {
          type: "order_update",
          order: finalOrder,
        });

        // Broadcast to contract-level public channel
        broadcast(`orderbook:${contractId}`, {
          type: "orderbook_update",
          order: finalOrder,
        });

        // Broadcast trades globally for charting
        for (const fill of matchResult.fills) {
          broadcast(`trades:${contractId}`, {
            type: "trade",
            trade: fill,
          });
        }

        return json({ order: finalOrder });
      } catch (err) {
        console.error("ORDER CREATE ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },

  //get all orders for the user
  {
    method: "GET",
    path: "/orders",
    auth: true,
    handler: async (req, { userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);
      try {
        const url = new URL(req.url);
        const status = url.searchParams.get("status");

        const orders = await prisma.order.findMany({
          where: {
            userId,
            ...(status ? { status } : {}),
          },
          include: { trades: true },
          orderBy: { createdAt: "desc" },
        });

        return json({ orders });
      } catch (err) {
        console.error("LIST ORDERS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  //get orders by single id
  {
    method: "GET",
    path: "/orders/:id",
    auth: true,
    handler: async (req, { params, userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);

      try {
        const orderId = params.id;
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { trades: true },
        });
        if (!order || order.userId !== userId) {
          return json({ error: "Order not found" }, 404);
        }
        return json({ order });
      } catch (err) {
        console.error("GET ORDER ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },

  //cancel an order
  {
    method: "DELETE",
    path: "/orders/:id",
    auth: true,
    handler: async (req, { params, userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);
      try {
        const orderId = params.id;
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.userId !== userId) {
          return json({ error: "Order not found" }, 404);
        }
        if (order.status !== "PENDING" && order.status !== "PARTIAL") {
          return json(
            { error: "Only pending or partial orders can be canceled" },
            400,
          );
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });

        broadcast(`orders:${userId}`, {
          type: "order_update",
          orderId,
          status: "CANCELLED",
        });

        broadcast(`orderbook:${order.contractId}`, {
          type: "orderbook_update",
          orderId,
          status: "CANCELLED",
        });

        return json({ success: true });
      } catch (err) {
        console.error("CANCEL ORDER ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
