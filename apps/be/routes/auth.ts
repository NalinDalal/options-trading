import { prisma } from "@repo/db";
import {
  hashPassword,
  verifyPassword,
  createToken,
  parseJSON,
  json,
} from "@repo/utils";
import { Route } from "../utils/router";
import { verify as jwtVerify } from "jsonwebtoken";

export const authRoutes: Route[] = [
  {
    method: "POST",
    path: "/signup",
    handler: async (req) => {
      try {
        const body = await parseJSON(req);
        const { email, password, name } = body || {};

        if (!email || !password)
          return json({ error: "email & password required" }, 400);

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return json({ error: "Email already exists" }, 409);

        const hashed = await hashPassword(password);
        const user = await prisma.user.create({
          data: { email, password: hashed, name: name ?? null },
        });

        const token = createToken(user.id);

        return json({
          token,
          user: { id: user.id, email: user.email },
        });
        console.log("Signed Up Successfully!!!");
      } catch (err) {
        console.error("SIGNUP ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  {
    method: "POST",
    path: "/signin",
    handler: async (req) => {
      try {
        const body = await parseJSON(req);
        const { email, password } = body || {};

        if (!email || !password)
          return json({ error: "email & password required" }, 400);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return json({ error: "Invalid credentials" }, 401);

        const ok = await verifyPassword(password, user.password);
        if (!ok) return json({ error: "Invalid credentials" }, 401);

        const token = createToken(user.id);

        return json({
          token,
          user: { id: user.id, email: user.email },
        });
        console.log("You are Signed In!!!");
      } catch (err) {
        console.error("SIGNIN ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    },
  },
  {
    method: "GET",
    path: "/me",
    handler: async (req) => {
      const auth = req.headers.get("authorization");
      if (!auth?.startsWith("Bearer ")) return json({ error: "No token" }, 401);

      const token = auth.split(" ")[1];

      try {
        const payload = await jwtVerify(token, process.env.JWT_SECRET!);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) return json({ error: "User not found" }, 404);

        return json({ user: { id: user.id, email: user.email } });
      } catch (err) {
        return json({ error: "Invalid or expired token" }, 401);
      }
    },
  },
];
