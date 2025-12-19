import { producer } from "./index";

let connected = false;

/**
 * Performs init kafka producer operation.
 * @returns {Promise<import("/Users/nalindalal/options-trading/node_modules/kafkajs/types/index").Producer>} Description of return value
 */
export async function initKafkaProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log(" Kafka producer connected");
  }
  return producer;
}

/**
 * Performs disconnect kafka producer operation.
 * @returns {Promise<void>} Description of return value
 */
export async function disconnectKafkaProducer() {
  if (connected) {
    await producer.disconnect();
    connected = false;
    console.log(" Kafka producer disconnected");
  }
}
