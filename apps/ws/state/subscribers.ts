import type { ServerWebSocket } from "bun";
import type { WSData } from "../types";

export const subscribers = new Map<string, Set<ServerWebSocket<WSData>>>();
