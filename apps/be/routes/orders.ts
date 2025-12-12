import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import type { Route } from "../utils/router";
import { broadcast } from "@repo/ws";

export const orderRoutes: Route[] = [
  {
    method: "POST",
    path: "/orders",
    handler: async (req, user) => {
      try {
        const body = await parseJSON(req);
        const { contractId, side, price, quantity } = body || {};

        if (!contractId || !side || !price || !quantity) {
          return json({ error: "Missing fields" }, 400);
        }

        // create order
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            contractId,
            side,
            price,
            quantity,
            status: "OPEN",
          },
        });

        // broadcast order creation
        broadcast(`orders:${user.id}`, {
          type: "order_created",
          order,
        });

        return json({ order });
      } catch (err) {
        console.error("ORDER CREATE ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },

  {
    method: "GET",
    path: "/orders",
    handler: async (req, user) => {
      try {
        const url = new URL(req.url);
        const status = url.searchParams.get("status");

        const orders = await prisma.order.findMany({
          where: {
            userId: user.id,
            ...(status ? { status } : {}),
          },
          orderBy: { createdAt: "desc" },
        });

        return json({ orders });
      } catch (err) {
        console.error("LIST ORDERS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
