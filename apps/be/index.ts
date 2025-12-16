import { serve } from "bun";
import { handleCors } from "./middleware/cors";
import { router } from "./utils/router";
import { authRoutes } from "./routes/auth";
import { underlyingRoutes } from "./routes/underlyings";
import { contractRoutes } from "./routes/contracts";
import { priceRoutes } from "./routes/prices";

import { orderRoutes } from "./routes/orders";

const port = Number(process.env.PORT || 3001);

// Env checks
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment");
}

serve({
  port,
  async fetch(req) {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Route to appropriate handler
    return router(req, [
      ...authRoutes,
      ...underlyingRoutes,
      ...contractRoutes,
      ...priceRoutes,
      ...orderRoutes,
    ]);
  },
});

console.log(`Server running on port ${port}`);
