import { jwtVerify } from "jsonwebtoken";
import { json } from "@repo/utils";

export async function requireAuth(req: Request): Promise<string | Response> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return json({ error: "No token" }, 401);
  }

  const token = auth.split(" ")[1];
  try {
    const payload = await jwtVerify(token, process.env.JWT_SECRET!);
    return payload.userId; // Return userId if valid
  } catch {
    return json({ error: "Invalid token" }, 401);
  }
}
