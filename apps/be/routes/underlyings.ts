import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import { Route } from "../utils/router";

export const underlyingRoutes: Route[] = [
  {
    method: "POST",
    path: "/underlyings",
    handler: async (req) => {
      try {
        const body = await parseJSON(req);
        const { symbol, decimals } = body || {};

        if (!symbol) return json({ error: "symbol required" }, 400);

        const exists = await prisma.underlying.findUnique({
          where: { symbol },
        });

        if (exists) return json({ error: "Underlying already exists" }, 409);

        const underlying = await prisma.underlying.create({
          data: {
            symbol,
            decimals: decimals ?? 2,
          },
        });

        return json({ underlying });
      } catch (err) {
        console.error("CREATE UNDERLYING ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  {
    method: "GET",
    path: "/underlyings",
    handler: async (req) => {
      try {
        const list = await prisma.underlying.findMany({
          orderBy: { symbol: "asc" },
        });

        return json({ underlyings: list });
      } catch (err) {
        console.error("LIST UNDERLYINGS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
