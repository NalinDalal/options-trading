export const TOPICS = {
  // price domain
  PRICE_UPDATES: "price.updates", // key = underlyingId
  PRICE_TICK: "price.tick", // raw ticks from poller
  PRICE_EVENTS: "price.events", // derived/normalized events

  // order domain
  ORDER_COMMANDS: "order.commands", // key = contractId
  ORDER_EVENTS: "order.events", // key = contractId

  // trade domain
  TRADE_EVENTS: "trade.events", // key = contractId

  // position domain
  POSITION_EVENTS: "position.events", // key = contractId
} as const;
