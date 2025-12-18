import { Kafka } from "kafkajs";
import { config } from "./config";
import { TOPICS } from "./topics";

export const kafka = new Kafka({
  clientId: "options-trading",
  brokers: [config.kafka.brokerUrl],
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
});

export const consumer = kafka.consumer({ groupId: "options-trading-group" });

export { TOPICS };
export * from "./topics";

export * from "./events/price";
export * from "./events/order";
export * from "./events/trade";
export * from "./events/position";

export * from "./producer";
export * from "./consumer";
