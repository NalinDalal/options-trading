import { consumer, producer, TOPICS } from "@repo/kafka";
import { prisma } from "@repo/db";
import { matchOrder } from "@be/utils/matchingEngine";
import { updatePositionFromTrade } from "@be/services/positions";

type OrderCommand =
  | {
      type: "PLACE_ORDER";
      payload: {
        userId: string;
        contractId: string;
        side: "BUY" | "SELL";
        orderType: "MARKET" | "LIMIT";
        price?: number | null; // number (to be converted to bigint)
        qty: number;
      };
    }
  | {
      type: "CANCEL_ORDER";
      payload: {
        userId: string;
        orderId: string;
      };
    };

/**
 * Performs ensure kafka operation.
 * @returns {Promise<void>} Description of return value
 */
async function ensureKafka() {
  await producer.connect();
  await consumer.connect();
}

/**
 * Performs on place order operation.
 * @param {{ type: "PLACE_ORDER"; payload: { userId: string; contractId: string; side: "BUY" | "SELL"; orderType: "MARKET" | "LIMIT"; price?: number; qty: number; }; }} cmd - Description of cmd
 * @returns {Promise<void>} Description of return value
 */
async function onPlaceOrder(
  cmd: Extract<OrderCommand, { type: "PLACE_ORDER" }>,
) {
  const { userId, contractId, side, orderType, price, qty } = cmd.payload;

  const order = await prisma.order.create({
    data: {
      userId,
      contractId,
      side,
      orderType,
      price:
        price !== undefined && price !== null
          ? BigInt(Math.round(price))
          : null,
      qty,
      filledQty: 0,
      status: "PENDING",
    },
  });

  // Emit order created event
  await producer.send({
    topic: TOPICS.ORDER_EVENTS,
    messages: [
      {
        key: contractId,
        value: JSON.stringify({ type: "ORDER_CREATED", userId, order }),
      },
    ],
  });

  // Try to match immediately
  try {
    const result = await matchOrder(order);

    // Process fills and update orders
    if (result.fills.length > 0) {
      // Group fills by orderId
      const fillsByOrderId: Record<string, typeof result.fills> = {};
      for (const fill of result.fills) {
        if (!fillsByOrderId[fill.orderId]) {
          fillsByOrderId[fill.orderId] = [];
        }
        fillsByOrderId[fill.orderId].push(fill);
      }

      // Process each order's fills
      for (const [orderId, orderFills] of Object.entries(fillsByOrderId)) {
        const orderFillsQty = orderFills.reduce((sum, f) => sum + f.qty, 0);
        const fillOrder = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!fillOrder) continue;

        // Create trades for each fill
        for (const fill of orderFills) {
          const trade = await prisma.trade.create({
            data: {
              orderId: fill.orderId,
              userId: fill.userId,
              price: fill.price,
              qty: fill.qty,
              direction: fill.direction,
            },
          });

          // Update position
          await updatePositionFromTrade({
            userId: fill.userId,
            contractId,
            price: fill.price,
            qty: fill.qty,
            direction: fill.direction,
          });

          // Emit trade event
          await producer.send({
            topic: TOPICS.TRADE_EVENTS,
            messages: [
              {
                key: contractId,
                value: JSON.stringify({
                  type: "TRADE_EXECUTED",
                  contractId,
                  trade,
                }),
              },
            ],
          });
        }

        // Update order status
        const newFilledQty = fillOrder.filledQty + orderFillsQty;
        const orderStatus =
          newFilledQty >= fillOrder.qty
            ? "FILLED"
            : newFilledQty > 0
              ? "PARTIAL"
              : "PENDING";

        const updated = await prisma.order.update({
          where: { id: orderId },
          data: { status: orderStatus, filledQty: newFilledQty },
        });

        await producer.send({
          topic: TOPICS.ORDER_EVENTS,
          messages: [
            {
              key: contractId,
              value: JSON.stringify({
                type: "ORDER_UPDATED",
                userId: fillOrder.userId,
                order: updated,
              }),
            },
          ],
        });
      }
    }

    // If order is still pending, update its status
    if (result.status === "PENDING") {
      await producer.send({
        topic: TOPICS.ORDER_EVENTS,
        messages: [
          {
            key: contractId,
            value: JSON.stringify({
              type: "ORDER_UPDATED",
              userId,
              order,
            }),
          },
        ],
      });
    }
  } catch (e) {
    console.error("Matching error", e);
  }
}

/**
 * Performs on cancel order operation.
 * @param {{ type: "CANCEL_ORDER"; payload: { userId: string; orderId: string; }; }} cmd - Description of cmd
 * @returns {Promise<void>} Description of return value
 */
async function onCancelOrder(
  cmd: Extract<OrderCommand, { type: "CANCEL_ORDER" }>,
) {
  const { userId, orderId } = cmd.payload;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.userId !== userId) return;
  if (order.status !== "PENDING" && order.status !== "PARTIAL") return;

  const cancelled = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  await producer.send({
    topic: TOPICS.ORDER_EVENTS,
    messages: [
      {
        key: cancelled.contractId,
        value: JSON.stringify({
          type: "ORDER_UPDATED",
          userId,
          order: cancelled,
        }),
      },
    ],
  });
}

/**
 * Performs start operation.
 * @returns {Promise<void>} Description of return value
 */
async function start() {
  await ensureKafka();
  await consumer.subscribe({
    topic: TOPICS.ORDER_COMMANDS,
    fromBeginning: false,
  });

  console.log("Order Engine started");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        if (!message.value) return;
        const cmd = JSON.parse(message.value.toString()) as OrderCommand;

        if (cmd.type === "PLACE_ORDER") {
          await onPlaceOrder(cmd);
        } else if (cmd.type === "CANCEL_ORDER") {
          await onCancelOrder(cmd);
        }
      } catch (e) {
        console.error("ORDER_COMMANDS handler error", e);
      }
    },
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
