// Vercel Edge Function: enruta todas las requests al handler SSR de TanStack Start.
import handler from "../dist/server/server.js";

export const config = { runtime: "edge" };

export default function (request) {
  return handler.fetch(request);
}
