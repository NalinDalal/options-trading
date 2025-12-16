export const TOPICS = {
  // price domain
  PRICE_UPDATES: "price.updates", // key = underlyingId

  // order domain
  ORDER_COMMANDS: "order.commands", // key = contractId
  ORDER_EVENTS: "order.events", // key = contractId

  // trade domain
  TRADE_EVENTS: "trade.events", // key = contractId

  // position domain
  POSITION_EVENTS: "position.events", // key = contractId
} as const;
