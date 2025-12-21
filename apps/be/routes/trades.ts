import { prisma } from "@repo/db";
import { json } from "@repo/utils";
import type { Route } from "../utils/router";

export const tradeRoutes: Route[] = [
  {
    method: "GET",
    path: "/trades",
    auth: true,
    handler: async (req, { userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);

      try {
        const url = new URL(req.url);
        const contractId = url.searchParams.get("contractId");

        const trades = await prisma.trade.findMany({
          where: {
            userId,
            ...(contractId ? { order: { contractId } } : {}),
          },
          include: {
            order: {
              select: {
                id: true,
                contractId: true,
                contract: {
                  select: {
                    id: true,
                    optionType: true,
                    strike: true,
                    expiry: true,
                    underlying: { select: { id: true, symbol: true } },
                  },
                },
              },
            },
          },
          orderBy: { timestamp: "desc" },
        });

        return json({ trades });
      } catch (err) {
        console.error("LIST TRADES ERROR", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
