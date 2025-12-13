import { json } from "@repo/utils";
import { requireAuth } from "../middleware/auth";

export type Route = {
  method: string;
  path: string | RegExp;
  handler: (
    req: Request,
    ctx: { params: Record<string, string>; userId?: string },
  ) => Promise<Response>;
  auth?: boolean;
};

/**
 * Performs match string path operation.
 * @param {string} pathname - Description of pathname
 * @param {string} pattern - Description of pattern
 * @returns {Record<string, string>} Description of return value
 */
function matchStringPath(pathname: string, pattern: string) {
  // Support express-style segments: /orders/:id
  if (!pattern.includes(":")) return pathname === pattern ? {} : null;

  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(":")) {
      const key = part.slice(1);
      params[key] = pathParts[i];
      continue;
    }

    if (part !== pathParts[i]) return null;
  }

  return params;
}

/**
 * Performs router operation.
 * @param {Request} req - Description of req
 * @param {import("/Users/nalindalal/exness-ts/apps/be/utils/router").Route[]} routes - Description of routes
 * @returns {Promise<Response>} Description of return value
 */
export async function router(req: Request, routes: Route[]) {
  const url = new URL(req.url);
  const method = req.method;

  for (const route of routes) {
    if (route.method !== method) continue;

    let params: Record<string, string> | null = null;

    if (typeof route.path === "string") {
      params = matchStringPath(url.pathname, route.path);
    } else {
      const match = url.pathname.match(route.path);
      params = match
        ? ((match.groups as Record<string, string> | null) ?? {})
        : null;
    }

    if (params === null) continue;

    // Auth guard when required
    let userId: string | undefined;
    if (route.auth) {
      const authResult = await requireAuth(req);
      if (authResult instanceof Response) return authResult;
      userId = authResult;
    }

    return route.handler(req, { params, userId });
  }

  return json({ error: "Route not found" }, 404);
}
