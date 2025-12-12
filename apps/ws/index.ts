import { serve, ServerWebSocket } from "bun";
import { verify as jwtVerify } from "jsonwebtoken";
import "dotenv/config";

const WS_PORT = Number(process.env.WS_PORT || 3002);

type WSData = {
  userId: string;
  subscriptions: Set<string>;
};

// Store all subscribers by channel
const subscribers = new Map<string, Set<ServerWebSocket<WSData>>>();

// WebSocket Handlers
function handleMessage(ws: ServerWebSocket<WSData>, message: string | Buffer) {
  try {
    const data = JSON.parse(message.toString());

    // SUBSCRIBE to channels
    if (data.type === "subscribe") {
      const { channels } = data;

      if (!Array.isArray(channels)) {
        ws.send(JSON.stringify({ error: "channels must be an array" }));
        return;
      }

      channels.forEach((channel: string) => {
        ws.data.subscriptions.add(channel);

        if (!subscribers.has(channel)) {
          subscribers.set(channel, new Set());
        }
        subscribers.get(channel)!.add(ws);
      });

      ws.send(
        JSON.stringify({
          type: "subscribed",
          channels: Array.from(ws.data.subscriptions),
        }),
      );
    }

    // UNSUBSCRIBE from channels
    else if (data.type === "unsubscribe") {
      const { channels } = data;

      if (!Array.isArray(channels)) {
        ws.send(JSON.stringify({ error: "channels must be an array" }));
        return;
      }

      channels.forEach((channel: string) => {
        ws.data.subscriptions.delete(channel);
        subscribers.get(channel)?.delete(ws);
      });

      ws.send(
        JSON.stringify({
          type: "unsubscribed",
          channels,
        }),
      );
    }

    // PING/PONG for keepalive
    else if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  } catch (err) {
    console.error("WS message error:", err);
    ws.send(JSON.stringify({ error: "Invalid message format" }));
  }
}

function handleOpen(ws: ServerWebSocket<WSData>) {
  console.log(` Client connected: ${ws.data.userId}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connected",
      userId: ws.data.userId,
      timestamp: Date.now(),
    }),
  );
}

function handleClose(ws: ServerWebSocket<WSData>) {
  console.log(` Client disconnected: ${ws.data.userId}`);

  // Cleanup all subscriptions
  ws.data.subscriptions.forEach((channel) => {
    subscribers.get(channel)?.delete(ws);

    // Remove empty channel sets
    if (subscribers.get(channel)?.size === 0) {
      subscribers.delete(channel);
    }
  });
}

// Broadcast Functions (Called from REST API)
export function broadcast(channel: string, message: any) {
  const subs = subscribers.get(channel);
  if (!subs || subs.size === 0) return;

  const data = JSON.stringify({
    ...message,
    timestamp: Date.now(),
  });

  subs.forEach((ws) => {
    try {
      ws.send(data);
    } catch (err) {
      console.error("Failed to send to client:", err);
    }
  });

  console.log(` Broadcasted to ${subs.size} clients on channel: ${channel}`);
}

export function broadcastPriceUpdate(symbol: string, price: number) {
  broadcast("prices", {
    type: "price_update",
    symbol,
    price,
  });
}

export function broadcastPositionUpdate(userId: string, position: any) {
  broadcast(`positions:${userId}`, {
    type: "position_update",
    position,
  });
}

export function broadcastOrderUpdate(userId: string, order: any) {
  broadcast(`orders:${userId}`, {
    type: "order_update",
    order,
  });
}

// Start WebSocket Server
serve({
  port: WS_PORT,

  async fetch(req, server) {
    // Only accept WebSocket upgrades
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("WebSocket server only", { status: 400 });
    }

    // Extract and verify JWT token
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    try {
      const payload = jwtVerify(token, process.env.JWT_SECRET!) as any;

      const upgraded = server.upgrade(req, {
        data: {
          userId: payload.userId,
          subscriptions: new Set<string>(),
        },
      });

      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 500 });
      }

      return undefined;
    } catch (err) {
      return new Response("Invalid token", { status: 401 });
    }
  },

  websocket: {
    message: handleMessage,
    open: handleOpen,
    close: handleClose,
  },
});

console.log(` WebSocket server running on ws://localhost:${WS_PORT}`);

// HTTP API for Broadcasting (for REST server to call)
const HTTP_PORT = Number(process.env.WS_HTTP_PORT || 3003);

serve({
  port: HTTP_PORT,

  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // POST /broadcast - Broadcast to a channel
    if (url.pathname === "/broadcast" && req.method === "POST") {
      try {
        const body = await req.json();
        const { channel, message } = body;

        if (!channel || !message) {
          return new Response(
            JSON.stringify({ error: "channel and message required" }),
            { status: 400, headers },
          );
        }

        broadcast(channel, message);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error" }), {
          status: 500,
          headers,
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(` WS HTTP API running on http://localhost:${WS_PORT}`);

// Health check & stats endpoint
setInterval(() => {
  console.log(
    `Active connections: ${Array.from(subscribers.values()).reduce((sum, set) => sum + set.size, 0)}`,
  );
  console.log(` Active channels: ${subscribers.size}`);
}, 30000); // Every 30 seconds

