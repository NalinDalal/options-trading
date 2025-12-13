import { Kafka } from "Kafkajs";
import config from "./config";

export const kafka = new Kafka({
  clientId: "options-trading",
  brokers: [config.kafka.brokerUrl],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 3000,
});

export const consumer = kafka.consumer({ groupId: "options-trading-group" });

export const TOPICS = {
  OHLC_DATA: "ohlc-data",
  BBO_DATA: "bbo-data",
} as const;

let isProducerConnected = false;

/**
 * Performs init kafka producer operation.
 * @returns {Promise<import("/Users/nalindalal/options-trading/node_modules/Kafkajs/types/index").Producer>} Description of return value
 */
export async function initKafkaProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log("  Kafka producer connected");
  }
  return producer;
}

/**
 * Performs disconnect kafka producer operation.
 * @returns {Promise<void>} Description of return value
 */
export async function disconnectKafkaProducer() {
  if (isProducerConnected) {
    await producer.disconnect();
    isProducerConnected = false;
    console.log("kafka producer disconnected");
  }
}
console.log("Hello via Bun!");

