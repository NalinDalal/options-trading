import { consumer, producer, TOPICS } from "@repo/kafka";
import { prisma } from "@repo/db";
import { publishPriceUpdate } from "@repo/ws";

type PriceTick = {
  underlyingId: string;
  symbol: string;
  price: number;
  ts: number;
};

/**
 * Performs start operation.
 * @returns {Promise<void>} Description of return value
 */
async function start() {
  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.PRICE_TICK,
    fromBeginning: false,
  });

  console.log("Price Engine started");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const tick = JSON.parse(message.value.toString()) as PriceTick;

      // 1. Persist price
      await prisma.underlying.update({
        where: { id: tick.underlyingId },
        data: {
          lastPrice: BigInt(Math.round(tick.price * 100)),
          lastUpdatedAt: new Date(tick.ts),
        },
      });

      // 2. Broadcast via WS gateway
      await publishPriceUpdate({
        underlyingId: tick.underlyingId,
        price: tick.price,
        ts: tick.ts,
      });

      // 3. Emit derived event
      await producer.send({
        topic: TOPICS.PRICE_EVENTS,
        messages: [
          {
            key: tick.underlyingId,
            value: JSON.stringify(tick),
          },
        ],
      });
    },
  });
}

start().catch(console.error);
