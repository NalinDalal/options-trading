import { serve } from "bun";
import { prisma } from "@repo/db";
import {
  hashPassword,
  verifyPassword,
  createToken,
  parseJSON,
} from "@repo/utils";
import "dotenv/config";
import { verify as jwtVerify } from "jsonwebtoken";

const port = Number(process.env.PORT || 3001);

/** -----------------------------------
 * CORS HEADERS (IMPORTANT)
 -------------------------------------*/
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

/** --- json response with CORS --- */
const json = (data: any, status = 200) =>
  new Response(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );

/** --- Ensure env sanity --- */
if (!process.env.JWT_SECRET) {
  throw new Error(" Missing JWT_SECRET in environment");
}

if (!process.env.DATABASE_URL) {
  throw new Error(" Missing DATABASE_URL in environment");
}

/** --- Main Server --- */
serve({
  port,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    /** ---------------------------
     * Handle CORS preflight
     ---------------------------*/
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // --- Root ---
    if (path === "/" && method === "GET") {
      return new Response("OK", { headers: corsHeaders });
    }

    // --- SIGNUP ---
    if (path === "/signup" && method === "POST") {
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
      } catch (err) {
        console.error("SIGNUP ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // --- SIGNIN ---
    if (path === "/signin" && method === "POST") {
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
      } catch (err) {
        console.error("SIGNIN ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // --- ME ---
    if (path === "/me" && method === "GET") {
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
    }

    // ---------------------------------------------------
    // UNDERLYINGS
    // ---------------------------------------------------

    // CREATE UNDERLYING
    if (path === "/underlyings" && method === "POST") {
      try {
        const body = await parseJSON(req);
        const { symbol, decimals } = body || {};

        if (!symbol) return json({ error: "symbol required" }, 400);

        const exists = await prisma.underlying.findUnique({
          where: { symbol },
        });

        if (exists) return json({ error: "Underlying already exists" }, 409);

        const underlying = await prisma.underlying.create({
          data: {
            symbol,
            decimals: decimals ?? 2,
          },
        });

        return json({ underlying });
      } catch (err) {
        console.error("CREATE UNDERLYING ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // LIST UNDERLYINGS
    if (path === "/underlyings" && method === "GET") {
      try {
        const list = await prisma.underlying.findMany({
          orderBy: { symbol: "asc" },
        });

        return json({ underlyings: list });
      } catch (err) {
        console.error("LIST UNDERLYINGS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // ---------------------------------------------------
    // OPTION CONTRACTS
    // ---------------------------------------------------

    // CREATE OPTION CONTRACT
    if (path === "/contracts" && method === "POST") {
      try {
        const body = await parseJSON(req);
        const {
          underlyingId,
          optionType,
          strike,
          expiry,
          multiplier,
          decimals,
        } = body || {};

        if (!underlyingId || !optionType || !strike || !expiry || !multiplier) {
          return json(
            {
              error:
                "required fields: underlyingId, optionType, strike, expiry, multiplier",
            },
            400,
          );
        }

        const contract = await prisma.optionContract.create({
          data: {
            underlyingId,
            optionType,
            strike: BigInt(String(strike)),
            expiry: new Date(expiry),
            multiplier,
            decimals: decimals ?? 2,
          },
        });

        return json({ contract });
      } catch (err) {
        console.error("CREATE CONTRACT ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // LIST CONTRACTS (with optional filters)
    if (path === "/contracts" && method === "GET") {
      try {
        const underlyingId = url.searchParams.get("underlyingId");
        const optionType = url.searchParams.get("optionType");
        const expiry = url.searchParams.get("expiry");

        const filters: any = {};

        if (underlyingId) filters.underlyingId = underlyingId;
        if (optionType) filters.optionType = optionType;
        if (expiry) filters.expiry = new Date(expiry);

        const list = await prisma.optionContract.findMany({
          where: filters,
          orderBy: [
            { expiry: "asc" },
            { strike: "asc" },
            { optionType: "asc" },
          ],
        });

        return json({ contracts: list });
      } catch (err) {
        console.error("LIST CONTRACTS ERROR:", err);
        return json({ error: "Internal error" }, 500);
      }
    }

    // --- Not Found ---
    return json({ error: "Route not found" }, 404);
  },
});

console.log(`Server running on port ${port}`);
