import { broadcast } from "@repo/ws";

export function emitOrderUpdate(userId: string, order: any) {
  broadcast(`orders:${userId}`, {
    type: "order_update",
    order,
  });
}

export function emitOrderbookUpdate(contractId: string, order: any) {
  broadcast(`orderbook:${contractId}`, {
    type: "orderbook_update",
    order,
  });
}

export function emitTrade(contractId: string, trade: any) {
  broadcast(`trades:${contractId}`, {
    type: "trade",
    trade,
  });
}
