import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import type { Route } from "../utils/router";

export const contractRoutes: Route[] = [
  // CREATE OPTION CONTRACT
  {
    method: "POST",
    path: "/contracts",
    handler: async (req) => {
      try {
        const body = await parseJSON(req);
        const {
          underlyingId,
          optionType,
          strike,
          expiry,
          multiplier,
          decimals,
        } = body || {};

        if (!underlyingId || !optionType || !strike || !expiry || !multiplier) {
          return json(
            {
              error:
                "required fields: underlyingId, optionType, strike, expiry, multiplier",
            },
            400,
          );
        }

        const contract = await prisma.optionContract.create({
          data: {
            underlyingId,
            optionType,
            strike: BigInt(String(strike)),
            expiry: new Date(expiry),
            multiplier,
            decimals: decimals ?? 2,
          },
        });

        return json({ contract });
      } catch (err) {
        console.error("CREATE CONTRACT ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },

  // LIST CONTRACTS (with optional filters)
  {
    method: "GET",
    path: "/contracts",
    handler: async (req) => {
      try {
        const url = new URL(req.url);
        const underlyingId = url.searchParams.get("underlyingId");
        const optionType = url.searchParams.get("optionType");
        const expiry = url.searchParams.get("expiry");

        const filters: any = {};

        if (underlyingId) filters.underlyingId = underlyingId;
        if (optionType) filters.optionType = optionType;
        if (expiry) filters.expiry = new Date(expiry);

        const list = await prisma.optionContract.findMany({
          where: filters,
          orderBy: [
            { expiry: "asc" },
            { strike: "asc" },
            { optionType: "asc" },
          ],
        });

        return json({ contracts: list });
      } catch (err) {
        console.error("LIST CONTRACTS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
