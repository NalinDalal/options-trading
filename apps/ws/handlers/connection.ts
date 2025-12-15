import type { ServerWebSocket } from "bun";
import type { WSData } from "../types";
import { subscribers } from "../state/subscribers";

export function handleOpen(ws: ServerWebSocket<WSData>) {
  ws.send(
    JSON.stringify({
      type: "connected",
      userId: ws.data.userId,
      timestamp: Date.now(),
    }),
  );
}

export function handleClose(ws: ServerWebSocket<WSData>) {
  for (const channel of ws.data.subscriptions) {
    const set = subscribers.get(channel);
    set?.delete(ws);
    if (set?.size === 0) subscribers.delete(channel);
  }
}
