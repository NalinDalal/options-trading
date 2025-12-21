import { serve } from "bun";
import { handleMessage } from "./handlers/message";
import { handleOpen, handleClose } from "./handlers/connection";
import { verifyJwt } from "./auth/verifyJwt";
import { startKafkaConsumer } from "./kafkaConsumer";
import "dotenv/config";

/**
 * Performs start ws server operation.
 * @param {number} port - Description of port
 * @returns {void} Description of return value
 */
function startWsServer(port: number) {
  serve({
    port,
    fetch(req, server) {
      if (req.headers.get("upgrade") !== "websocket")
        return new Response("WS only", { status: 400 });

      const token = new URL(req.url).searchParams.get("token");
      if (!token) return new Response("Unauthorized", { status: 401 });

      const payload = verifyJwt(token);

      server.upgrade(req, {
        data: {
          userId: payload.userId,
          subscriptions: new Set(),
        },
      });
    },
    websocket: {
      message: handleMessage,
      open: handleOpen,
      close: handleClose,
    },
  });
}

const wsPort = Number(process.env.WS_PORT || 8080);
startWsServer(wsPort);
console.log(`WS gateway listening on ${wsPort}`);

startKafkaConsumer().catch((e) => {
  console.error("Failed to start WS Kafka consumer", e);
});

/**
 * WebSocket Gateway
 *
 * Responsibilities:
 * - Authenticate WS connections
 * - Track per-connection subscriptions
 * - Consume Kafka domain events
 * - Fan-out events to subscribed clients
 *
 * This service contains NO business logic.
 * It is purely an event-to-socket bridge.
 */
