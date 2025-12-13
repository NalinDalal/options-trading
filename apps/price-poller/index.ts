import { initKafkaProducer, TOPICS } from "@repo/kafka";

type PriceTick = {
  underlyingId: string;
  symbol: string;
  price: number;
  ts: number;
};

async function fetchPrices(): Promise<PriceTick[]> {
  // mock for now
  return [
    {
      underlyingId: "NIFTY",
      symbol: "NIFTY",
      price: 22543.25 + Math.random() * 10,
      ts: Date.now(),
    },
  ];
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function start() {
  const producer = await initKafkaProducer();
  console.log(" Price Poller started");

  while (true) {
    const ticks = await fetchPrices();

    await producer.send({
      topic: TOPICS.PRICE_TICK,
      messages: ticks.map((tick) => ({
        key: tick.symbol,
        value: JSON.stringify(tick),
      })),
    });

    await sleep(1000);
  }
}

start().catch(console.error);

