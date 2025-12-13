import { sign } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

/**
 * Performs hash password operation.
 * @param {string} password - Description of password
 * @returns {Promise<string>} Description of return value
 */
export async function hashPassword(password: string) {
  return hash(password, 10);
}

/**
 * Performs verify password operation.
 * @param {string} password - Description of password
 * @param {string} hashed - Description of hashed
 * @returns {Promise<boolean>} Description of return value
 */
export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed);
}

/**
 * Performs create token operation.
 * @param {string} userId - Description of userId
 * @returns {any} Description of return value
 */
export function createToken(userId: string) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Performs parse j s o n operation.
 * @param {Request} req - Description of req
 * @returns {Promise<any>} Description of return value
 */
export async function parseJSON(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Performs json operation.
 * @param {any} data - Description of data
 * @param {number} status - Description of status
 * @returns {Response} Description of return value
 */
export function json(data: any, status = 200) {
  return new Response(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}
