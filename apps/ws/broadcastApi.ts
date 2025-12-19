import { broadcast } from "./broadcast/core";

/**
 * Performs handle broadcast api operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleBroadcastApi(req: Request) {
  const body = await req.json();
  if (!body.channel || !body.message) {
    return new Response("Bad request", { status: 400 });
  }
  broadcast(body.channel, body.message);
  return new Response(JSON.stringify({ success: true }));
}
