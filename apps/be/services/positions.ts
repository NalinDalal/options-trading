import { prisma } from "@repo/db";

type TradeInput = {
  userId: string;
  contractId: string;
  price: bigint;
  qty: number;
  direction: "BUY" | "SELL";
};

// Maintains position using signed quantity semantics mapped to (side, qty)
/**
 * Performs update position from trade operation.
 * @param {TradeInput} trade - Description of trade
 * @returns {Promise<{ id: string; userId: string; contractId: string; side: import("/Users/nalindalal/exness-ts/packages/db/generated/prisma/enums").Side; avgPrice: bigint; qty: number; realizedPnl: bigint; unrealizedPnl: bigint; createdAt: Date; closedAt: Date; }>} Description of return value
 */
export async function updatePositionFromTrade(trade: TradeInput) {
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
        side: "BUY",
        qty: 0,
        avgPrice: 0n,
        realizedPnl: 0n,
        unrealizedPnl: 0n,
      },
    });
  }

  // Represent net position as signed quantity for easier math
  let signedQty = position.side === "BUY" ? position.qty : -position.qty;
  const tradeSigned = trade.direction === "BUY" ? trade.qty : -trade.qty;
  let avgPrice = position.avgPrice ?? 0n;
  let realizedPnl = position.realizedPnl ?? 0n;

  const tradePrice = BigInt(trade.price);

  if (signedQty === 0) {
    signedQty = tradeSigned;
    avgPrice = tradePrice;
  } else if (Math.sign(signedQty) === Math.sign(tradeSigned)) {
    // Adding to existing direction → weighted average
    const currentAbs = BigInt(Math.abs(signedQty));
    const incomingAbs = BigInt(Math.abs(tradeSigned));
    const totalCost = avgPrice * currentAbs + tradePrice * incomingAbs;
    signedQty += tradeSigned;
    const newAbs = BigInt(Math.abs(signedQty));
    avgPrice = newAbs === 0n ? 0n : totalCost / newAbs;
  } else {
    // Closing or flipping
    const closeQty = Math.min(Math.abs(tradeSigned), Math.abs(signedQty));
    const closeQtyBig = BigInt(closeQty);

    // Long -> SELL realizes (sell - avg)
    // Short -> BUY realizes (avg - buy)
    const pnl =
      signedQty > 0
        ? (tradePrice - avgPrice) * closeQtyBig
        : (avgPrice - tradePrice) * closeQtyBig;

    realizedPnl += pnl;

    const remaining = signedQty + tradeSigned;

    if (remaining === 0) {
      signedQty = 0;
      avgPrice = 0n;
    } else if (Math.sign(remaining) === Math.sign(signedQty)) {
      // Reduced but same direction; keep avgPrice
      signedQty = remaining;
    } else {
      // Flipped direction; set avg to trade price for new side
      signedQty = remaining;
      avgPrice = tradePrice;
    }
  }

  const nextSide = signedQty >= 0 ? "BUY" : "SELL";
  const nextQty = Math.abs(signedQty);

  const updated = await prisma.position.update({
    where: {
      userId_contractId: {
        userId: trade.userId,
        contractId: trade.contractId,
      },
    },
    data: {
      side: nextSide,
      qty: nextQty,
      avgPrice,
      realizedPnl,
      unrealizedPnl: 0n,
    },
  });

  return updated;
}
