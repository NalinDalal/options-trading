import { broadcast } from "./core";

export const broadcastPriceUpdate = (symbol: string, price: number) =>
  broadcast("prices", { type: "price_update", symbol, price });

export const broadcastOrderUpdate = (userId: string, order: any) =>
  broadcast(`orders:${userId}`, { type: "order_update", order });

export const broadcastPositionUpdate = (userId: string, position: any) =>
  broadcast(`positions:${userId}`, { type: "position_update", position });
