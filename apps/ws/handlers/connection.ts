import type { ServerWebSocket } from "bun";
import type { WSData } from "../types";
import { subscribers } from "../state/subscribers";

/**
 * Performs handle open operation.
 * @param {Bun.ServerWebSocket<import("/Users/nalindalal/options-trading/apps/ws/types").WSData>} ws - Description of ws
 * @returns {void} Description of return value
 */
export function handleOpen(ws: ServerWebSocket<WSData>) {
  ws.send(
    JSON.stringify({
      type: "connected",
      userId: ws.data.userId,
      timestamp: Date.now(),
    }),
  );
}

/**
 * Performs handle close operation.
 * @param {Bun.ServerWebSocket<import("/Users/nalindalal/options-trading/apps/ws/types").WSData>} ws - Description of ws
 * @returns {void} Description of return value
 */
export function handleClose(ws: ServerWebSocket<WSData>) {
  for (const channel of ws.data.subscriptions) {
    const set = subscribers.get(channel);
    set?.delete(ws);
    if (set?.size === 0) subscribers.delete(channel);
  }
}
