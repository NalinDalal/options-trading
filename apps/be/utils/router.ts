import { json } from "@repo/utils";
export type Route = {
  method: string;
  path: string | RegExp;
  handler: (req: Request, params?: any) => Promise<Response>;
};

export async function router(req: Request, routes: Route[]) {
  const url = new URL(req.url);
  const method = req.method;

  for (const route of routes) {
    if (route.method !== method) continue;

    if (typeof route.path === "string") {
      if (url.pathname === route.path) {
        return route.handler(req);
      }
    } else {
      const match = url.pathname.match(route.path);
      if (match) {
        return route.handler(req, match.groups);
      }
    }
  }

  return json({ error: "Route not found" }, 404);
}
