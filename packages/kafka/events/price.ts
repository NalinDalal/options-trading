export type PriceUpdateEvent = {
  type: "PRICE_UPDATE";
  underlyingId: string;
  symbol: string;
  price: number;
  ts: number;
  source: "poller" | "replay";
};
