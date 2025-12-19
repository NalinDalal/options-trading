import { broadcast } from "@repo/ws";

/**
 * Performs emit order update operation.
 * @param {string} userId - Description of userId
 * @param {any} order - Description of order
 * @returns {void} Description of return value
 */
export function emitOrderUpdate(userId: string, order: any) {
  broadcast(`orders:${userId}`, {
    type: "order_update",
    order,
  });
}

/**
 * Performs emit orderbook update operation.
 * @param {string} contractId - Description of contractId
 * @param {any} order - Description of order
 * @returns {void} Description of return value
 */
export function emitOrderbookUpdate(contractId: string, order: any) {
  broadcast(`orderbook:${contractId}`, {
    type: "orderbook_update",
    order,
  });
}

/**
 * Performs emit trade operation.
 * @param {string} contractId - Description of contractId
 * @param {any} trade - Description of trade
 * @returns {void} Description of return value
 */
export function emitTrade(contractId: string, trade: any) {
  broadcast(`trades:${contractId}`, {
    type: "trade",
    trade,
  });
}
