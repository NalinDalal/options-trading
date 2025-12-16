import { consumer, producer } from "@repo/kafka";
import { TOPICS } from "@repo/kafka/topics";
import { prisma } from "@repo/db";
import { matchOrder } from "@be/utils/matchingEngine";

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

async function ensureKafka() {
  await producer.connect();
  await consumer.connect();
}

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

  // Try to match immediately (placeholder engine returns PENDING)
  try {
    const result = await matchOrder(order);

    if (result.fills.length > 0 || result.status !== "PENDING") {
      // Persist trades (if any)
      for (const fill of result.fills) {
        const trade = await prisma.trade.create({
          data: {
            orderId: fill.orderId,
            userId: fill.userId,
            price: BigInt(fill.price),
            qty: fill.qty,
            direction: fill.direction,
          },
        });

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

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: result.status, filledQty: result.filledQty },
      });

      await producer.send({
        topic: TOPICS.ORDER_EVENTS,
        messages: [
          {
            key: contractId,
            value: JSON.stringify({
              type: "ORDER_UPDATED",
              userId,
              order: updated,
            }),
          },
        ],
      });
    }
  } catch (e) {
    console.error("Matching error", e);
  }
}

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

