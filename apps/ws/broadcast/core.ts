import { subscribers } from "../state/subscribers";

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
