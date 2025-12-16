import { consumer } from "@repo/kafka";
import { TOPICS } from "@repo/kafka/topics";
import { broadcast } from "./broadcast/core";

export async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.PRICE_UPDATES,
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: TOPICS.ORDER_EVENTS,
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: TOPICS.TRADE_EVENTS,
    fromBeginning: false,
  });
  if ((TOPICS as any).POSITION_EVENTS) {
    await consumer.subscribe({
      topic: (TOPICS as any).POSITION_EVENTS,
      fromBeginning: false,
    });
  }

  console.log("WS Kafka consumer started");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      try {
        const evt = JSON.parse(message.value.toString());

        switch (topic) {
          case TOPICS.PRICE_UPDATES: {
            broadcast("prices", {
              type: "price_update",
              symbol: evt.symbol,
              price: evt.price,
            });
            break;
          }
          case TOPICS.ORDER_EVENTS: {
            // ORDER_CREATED / ORDER_UPDATED events with { userId, order }
            if (evt?.order && evt?.userId) {
              broadcast(`orders:${evt.userId}`, {
                type: "order_update",
                order: evt.order,
              });
              broadcast(`orderbook:${evt.order.contractId}`, {
                type: "orderbook_update",
                order: evt.order,
              });
            }
            break;
          }
          case TOPICS.TRADE_EVENTS: {
            // { contractId, trade }
            if (evt?.trade && evt?.contractId) {
              broadcast(`trades:${evt.contractId}`, {
                type: "trade",
                trade: evt.trade,
              });
            }
            break;
          }
          default: {
            // POSITION_EVENTS (optional)
            if (
              (TOPICS as any).POSITION_EVENTS &&
              topic === (TOPICS as any).POSITION_EVENTS
            ) {
              if (evt?.position && evt?.userId) {
                broadcast(`positions:${evt.userId}`, {
                  type: "position_update",
                  position: evt.position,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("WS Kafka consumer message error", e);
      }
    },
  });
}
