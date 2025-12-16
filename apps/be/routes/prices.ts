import { prisma } from "@repo/db";
import { parseJSON, json } from "@repo/utils";
import { Route } from "../utils/router";
import { initKafkaProducer } from "@repo/kafka/producer";
import { TOPICS } from "@repo/kafka/topics";

export const priceRoutes: Route[] = [
  // UPDATE UNDERLYING PRICE
  {
    method: "POST",
    path: /^\/underlyings\/([^\/]+)\/price$/,
    handler: async (req, params) => {
      try {
        const id = req.url.split("/underlyings/")[1].split("/price")[0];
        const body = await parseJSON(req);
        const { price } = body || {};

        if (!price) return json({ error: "price required" }, 400);

        const underlying = await prisma.underlying.update({
          where: { id },
          data: {
            currentPrice: BigInt(String(price)),
            lastUpdated: new Date(),
          },
        });

        // Publish price update to Kafka; WS will broadcast
        const producer = await initKafkaProducer();
        await producer.send({
          topic: TOPICS.PRICE_UPDATES,
          messages: [
            {
              key: underlying.id,
              value: JSON.stringify({
                symbol: underlying.symbol,
                underlyingId: underlying.id,
                price: Number(underlying.currentPrice),
                ts: Date.now(),
              }),
            },
          ],
        });

        return json({ underlying });
      } catch (err) {
        console.error("UPDATE PRICE ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  // GET ALL PRICES
  {
    method: "GET",
    path: "/prices",
    handler: async (req) => {
      try {
        const underlyings = await prisma.underlying.findMany({
          select: {
            id: true,
            symbol: true,
            currentPrice: true,
            lastUpdated: true,
          },
          orderBy: { symbol: "asc" },
        });

        return json({ prices: underlyings });
      } catch (err) {
        console.error("GET PRICES ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  // GET OPTION CHAIN
  {
    method: "GET",
    path: /^\/chain\/([^\/]+)$/,
    handler: async (req) => {
      try {
        const underlyingId = req.url.split("/chain/")[1].split("?")[0];
        const url = new URL(req.url);
        const expiry = url.searchParams.get("expiry");

        const filters: any = { underlyingId };
        if (expiry) filters.expiry = new Date(expiry);

        const contracts = await prisma.optionContract.findMany({
          where: filters,
          include: {
            underlying: {
              select: {
                id: true,
                symbol: true,
                currentPrice: true,
              },
            },
          },
          orderBy: [{ strike: "asc" }, { optionType: "asc" }],
        });

        return json({ chain: contracts });
      } catch (err) {
        console.error("GET CHAIN ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
];
