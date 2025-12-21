import { prisma } from "@repo/db";
import { json } from "@repo/utils";
import type { Route } from "../utils/router";

export const orderbookRoutes: Route[] = [
  {
    method: "GET",
    path: "/orderbook/:contractId",
    handler: async (_req, { params }) => {
      const contractId = params.contractId;
      if (!contractId) return json({ error: "contractId required" }, 400);

      try {
        const [bids, asks] = await Promise.all([
          prisma.order.findMany({
            where: {
              contractId,
              side: "BUY",
              status: { in: ["PENDING", "PARTIAL"] },
            },
            orderBy: [{ price: "desc" }, { createdAt: "asc" }],
          }),
          prisma.order.findMany({
            where: {
              contractId,
              side: "SELL",
              status: { in: ["PENDING", "PARTIAL"] },
            },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
          }),
        ]);

        const format = (orders: typeof bids) =>
          orders.map((o) => ({
            id: o.id,
            side: o.side,
            price: o.price,
            qty: o.qty,
            filledQty: o.filledQty,
            remainingQty: o.qty - o.filledQty,
            orderType: o.orderType,
            createdAt: o.createdAt,
          }));

        return json({
          contractId,
          bids: format(bids),
          asks: format(asks),
        });
      } catch (err) {
        console.error("ORDERBOOK ERROR", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
