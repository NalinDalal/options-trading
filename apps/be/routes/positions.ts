import { prisma } from "@repo/db";
import { json } from "@repo/utils";
import type { Route } from "../utils/router";

export const positionRoutes: Route[] = [
  {
    method: "GET",
    path: "/positions",
    auth: true,
    handler: async (req, { userId }) => {
      if (!userId) return json({ error: "Unauthorized" }, 401);

      try {
        const url = new URL(req.url);
        const contractId = url.searchParams.get("contractId");

        const positions = await prisma.position.findMany({
          where: {
            userId,
            ...(contractId ? { contractId } : {}),
          },
          include: {
            contract: {
              select: {
                id: true,
                optionType: true,
                strike: true,
                expiry: true,
                underlying: {
                  select: { id: true, symbol: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return json({ positions });
      } catch (err) {
        console.error("LIST POSITIONS ERROR", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
