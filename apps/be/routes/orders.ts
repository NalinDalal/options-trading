import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import type { Route } from "../utils/router";
import { initKafkaProducer } from "@repo/kafka/producer";
import { TOPICS } from "@repo/kafka/topics";

/**
 * NOTE:
 * HTTP layer only accepts intent and emits commands.
 * All matching, fills, and state transitions happen
 * asynchronously via Kafka-driven engines.
 *
 * This keeps the exchange core deterministic,
 * replayable, and horizontally scalable.
 */

/**
 *TODO:
 * 1. Write order-engine Kafka consumer
 * 2. Plug in your existing matchingEngine
 * 3. Emit proper events
 * 4. Wire WS gateway to Kafka (no direct calls)
 */
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

        // Emit command to Kafka; engine will persist and process
        const producer = await initKafkaProducer();
        await producer.send({
          topic: TOPICS.ORDER_COMMANDS,
          messages: [
            {
              key: contractId,
              value: JSON.stringify({
                type: "PLACE_ORDER",
                payload: {
                  userId,
                  contractId,
                  side,
                  orderType: isLimitOrder ? "LIMIT" : "MARKET",
                  price: isLimitOrder ? Number(price) : null,
                  qty,
                },
              }),
            },
          ],
        });

        return json({ accepted: true });
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

        // Emit cancel command to Kafka
        const producer = await initKafkaProducer();
        await producer.send({
          topic: TOPICS.ORDER_COMMANDS,
          messages: [
            {
              key: order.contractId,
              value: JSON.stringify({
                type: "CANCEL_ORDER",
                payload: { userId, orderId },
              }),
            },
          ],
        });

        return json({ accepted: true });
      } catch (err) {
        console.error("CANCEL ORDER ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
