import { subscribers } from "../state/subscribers";

/**
 * Performs broadcast operation.
 * @param {string} channel - Description of channel
 * @param {any} message - Description of message
 * @returns {void} Description of return value
 */
export function broadcast(channel: string, message: any) {
  const subs = subscribers.get(channel);
  if (!subs) return;

  const payload = JSON.stringify({
    ...message,
    timestamp: Date.now(),
  });

  for (const ws of subs) {
    try {
      ws.send(payload);
    } catch {}
  }
}
