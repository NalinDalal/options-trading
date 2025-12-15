import { verify } from "jsonwebtoken";

export function verifyJwt(token: string) {
  return verify(token, process.env.JWT_SECRET!) as any;
}
