export type TradeExecutedEvent = {
  type: "TRADE_EXECUTED";
  tradeId: string;
  contractId: string;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  qty: number;
  ts: number;
};
