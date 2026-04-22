// Vercel Serverless Function que ejecuta el handler SSR de TanStack Start.
// Hace que la app funcione en Vercel sin configuración adicional.
// @ts-ignore - resolved at runtime from build output
import handler from "../dist/server/server.js";

export const config = {
  runtime: "nodejs20.x",
};

export default handler;
