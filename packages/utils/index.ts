import { sign } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed);
}

export function createToken(userId: string) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function parseJSON(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function json(data: any, status = 200) {
  return new Response(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}
