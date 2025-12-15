import { Kafka } from "kafkajs";
import { config } from "./config";

export const kafka = new Kafka({
  clientId: "options-trading",
  brokers: [config.kafka.brokerUrl],
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
});

export const consumer = kafka.consumer({ groupId: "options-trading-group" });
