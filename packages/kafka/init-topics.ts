import { Kafka } from "kafkajs";
import { TOPICS } from "./topics.js";

const kafka = new Kafka({
  clientId: "options-trading-admin",
  brokers: [process.env.KAFKA_BROKER_URL || "localhost:9092"],
});

const admin = kafka.admin();

/**
 * Initialize all Kafka topics required by the application
 */
async function initTopics() {
  try {
    await admin.connect();
    console.log("✓ Connected to Kafka");

    // Get list of topics to create
    const topicsToCreate = Object.values(TOPICS).map((topic) => ({
      topic,
      numPartitions: 3,
      replicationFactor: 1,
    }));

    console.log("\nCreating topics:");
    topicsToCreate.forEach((t) => console.log(`  - ${t.topic}`));

    await admin.createTopics({
      topics: topicsToCreate,
      waitForLeaders: true,
    });

    console.log("\n✓ All topics created successfully!");

    // List all topics to verify
    const existingTopics = await admin.listTopics();
    console.log("\nExisting topics:");
    existingTopics.forEach((topic) => console.log(`  - ${topic}`));

    await admin.disconnect();
  } catch (error: any) {
    if (error.type === "TOPIC_ALREADY_EXISTS") {
      console.log("✓ Topics already exist");
      await admin.disconnect();
    } else {
      console.error("Error initializing topics:", error);
      process.exit(1);
    }
  }
}

initTopics();
