import type { ServerWebSocket } from "bun";
import type { WSData } from "../types";
import { subscribers } from "../state/subscribers";

/**
 * Performs handle message operation.
 * @param {Bun.ServerWebSocket<import("/Users/nalindalal/options-trading/apps/ws/types").WSData>} ws - Description of ws
 * @param {string | Buffer<ArrayBufferLike>} message - Description of message
 * @returns {void} Description of return value
 */
export function handleMessage(
  ws: ServerWebSocket<WSData>,
  message: string | Buffer,
) {
  try {
    const data = JSON.parse(message.toString());

    if (data.type === "subscribe") {
      if (!Array.isArray(data.channels)) {
        ws.send(JSON.stringify({ error: "channels must be an array" }));
        return;
      }

      for (const channel of data.channels) {
        ws.data.subscriptions.add(channel);

        if (!subscribers.has(channel)) {
          subscribers.set(channel, new Set());
        }
        subscribers.get(channel)!.add(ws);
      }

      ws.send(
        JSON.stringify({
          type: "subscribed",
          channels: [...ws.data.subscriptions],
        }),
      );
    }

    if (data.type === "unsubscribe") {
      for (const channel of data.channels ?? []) {
        ws.data.subscriptions.delete(channel);
        subscribers.get(channel)?.delete(ws);
      }

      ws.send(
        JSON.stringify({
          type: "unsubscribed",
          channels: data.channels,
        }),
      );
    }

    if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  } catch {
    ws.send(JSON.stringify({ error: "Invalid message format" }));
  }
}
