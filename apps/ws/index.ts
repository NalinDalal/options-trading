import { serve } from "bun";
import { handleMessage } from "./handlers/message";
import { handleOpen, handleClose } from "./handlers/connection";
import { verifyJwt } from "./auth/verifyJwt";
import "dotenv/config";
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

startWsServer(Number(process.env.WS_PORT || 3002));
