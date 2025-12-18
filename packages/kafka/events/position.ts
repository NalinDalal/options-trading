export type PositionUpdatedEvent = {
  type: "POSITION_UPDATED";
  userId: string;
  contractId: string;
  netQty: number;
  avgPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  ts: number;
};
