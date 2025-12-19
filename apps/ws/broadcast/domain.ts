import { broadcast } from "./core";

export const broadcastPriceUpdate = /**
 * Executes broadcast price update operation.
 * @param {string} symbol - Description of symbol
 * @param {number} price - Description of price
 * @returns {void} Description of return value
 */
(symbol: string, price: number) =>
  broadcast("prices", { type: "price_update", symbol, price });

export const broadcastOrderUpdate = /**
 * Executes broadcast order update operation.
 * @param {string} userId - Description of userId
 * @param {any} order - Description of order
 * @returns {void} Description of return value
 */
(userId: string, order: any) =>
  broadcast(`orders:${userId}`, { type: "order_update", order });

export const broadcastPositionUpdate = /**
 * Executes broadcast position update operation.
 * @param {string} userId - Description of userId
 * @param {any} position - Description of position
 * @returns {void} Description of return value
 */
(userId: string, position: any) =>
  broadcast(`positions:${userId}`, { type: "position_update", position });
