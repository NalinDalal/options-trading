export type OrderCreatedEvent = {
  type: "ORDER_CREATED";
  orderId: string;
  userId: string;
  contractId: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  price: number | null;
  qty: number;
  ts: number;
};

export type OrderUpdatedEvent = {
  type: "ORDER_UPDATED";
  orderId: string;
  contractId: string;
  status: "PENDING" | "PARTIAL" | "FILLED" | "CANCELLED";
  filledQty: number;
  ts: number;
};

export type OrderEvent = OrderCreatedEvent | OrderUpdatedEvent;
