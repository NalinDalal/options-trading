import { verify } from "jsonwebtoken";

/**
 * Performs verify jwt operation.
 * @param {string} token - Description of token
 * @returns {any} Description of return value
 */
export function verifyJwt(token: string) {
  return verify(token, process.env.JWT_SECRET!) as any;
}
