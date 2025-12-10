import { serve } from "bun";
import { prisma } from "@repo/db";

import {
  hashPassword,
  verifyPassword,
  createToken,
  parseJSON,
} from "@repo/utils";

const port = 5000;

serve({
  port,
  routes: {
    "/": () => new Response("Home"),

    // --- SIGN UP ---
    "POST /signup": async (req) => {
      const body = await parseJSON(req);
      if (!body?.email || !body?.password)
        return json({ error: "email & password required" }, 400);

      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existing) return json({ error: "Email already exists" }, 409);

      const hashed = await hashPassword(body.password);

      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashed,
          name: body.name ?? null,
        },
      });

      const token = createToken(user.id);

      return json({ token, user: { id: user.id, email: user.email } });
    },

    // --- SIGN IN ---
    "POST /signin": async (req) => {
      const body = await parseJSON(req);
      if (!body?.email || !body?.password)
        return json({ error: "email & password required" }, 400);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) return json({ error: "Invalid email or password" }, 401);

      const ok = await verifyPassword(body.password, user.password);
      if (!ok) return json({ error: "Invalid email or password" }, 401);

      const token = createToken(user.id);

      return json({ token, user: { id: user.id, email: user.email } });
    },

    // --- ME (requires Authorization: Bearer token) ---
    "GET /me": async (req) => {
      const auth = req.headers.get("authorization");
      if (!auth?.startsWith("Bearer ")) return json({ error: "No token" }, 401);

      const token = auth.split(" ")[1];

      try {
        const { userId } = await Bun.jwt.verify(token, process.env.JWT_SECRET!);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return json({ user });
      } catch {
        return json({ error: "Invalid token" }, 401);
      }
    },
  },
  fetch(req) {
    return new Response("404!");
  },
});

console.log("Listening on port:", port);
