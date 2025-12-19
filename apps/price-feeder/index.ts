import { initKafkaProducer, TOPICS } from "@repo/kafka";
import { SimulatorAdapter } from "./adapters/SimulatorAdapter";

/**
 * Performs start operation.
 * @returns {Promise<void>} Description of return value
 */
async function start() {
  const producer = await initKafkaProducer();

  const adapter = new SimulatorAdapter();

  await adapter.start(async (tick) => {
    const underlyingId = tick.symbol; // later mapping table

    await producer.send({
      topic: TOPICS.PRICE_UPDATES,
      messages: [
        {
          key: underlyingId,
          value: JSON.stringify({
            underlyingId,
            symbol: tick.symbol,
            price: tick.price,
            ts: tick.ts,
          }),
        },
      ],
    });
  });
}

start().catch(console.error);

