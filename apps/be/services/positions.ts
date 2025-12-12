import { prisma } from "@repo/db";

export async function updatePositionFromTrade(trade: {
  userId: string;
  contractId: string;
  price: bigint;
  qty: number;
  direction: "BUY" | "SELL";
}) {
  let position = await prisma.position.findUnique({
    where: {
      userId_contractId: {
        userId: trade.userId,
        contractId: trade.contractId,
      },
    },
  });

  if (!position) {
    position = await prisma.position.create({
      data: {
        userId: trade.userId,
        contractId: trade.contractId,
        netQty: 0,
        avgPrice: null,
        realizedPnl: 0n,
      },
    });
  }

  let { netQty, avgPrice, realizedPnl } = position;

  const tradeQty = trade.qty;
  const tradePrice = trade.price;

  if (trade.direction === "BUY") {
    // Weighted average price update
    const totalCost =
      (avgPrice ? BigInt(avgPrice) * BigInt(netQty) : 0n) +
      tradePrice * BigInt(tradeQty);

    netQty += tradeQty;
    avgPrice = netQty > 0 ? totalCost / BigInt(netQty) : null;
  } else {
    // SELL logic
    if (avgPrice && netQty > 0) {
      // Realized PnL = (sellPrice - avgPrice) * qty
      const pnl = (tradePrice - BigInt(avgPrice)) * BigInt(tradeQty);
      realizedPnl = (realizedPnl || 0n) + pnl;
    }

    netQty -= tradeQty;

    // If fully closed, reset avg price
    if (netQty === 0) {
      avgPrice = null;
    }
  }

  const updated = await prisma.position.update({
    where: {
      userId_contractId: {
        userId: trade.userId,
        contractId: trade.contractId,
      },
    },
    data: {
      netQty,
      avgPrice,
      realizedPnl,
    },
  });

  return updated;
}
