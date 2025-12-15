import { producer } from "./index";

let connected = false;

export async function initKafkaProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log(" Kafka producer connected");
  }
  return producer;
}

export async function disconnectKafkaProducer() {
  if (connected) {
    await producer.disconnect();
    connected = false;
    console.log(" Kafka producer disconnected");
  }
}
