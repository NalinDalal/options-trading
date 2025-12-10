import { sign, verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed);
}

export function createToken(userId: string) {
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function parseJSON(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function json(data: any, status = 200) {
  return Response.json(data, { status });
}
