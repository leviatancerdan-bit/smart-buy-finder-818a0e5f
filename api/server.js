// Vercel Serverless Function (Node) que monta el handler SSR de TanStack Start.
// Toda la lógica del producto vive en el cliente; este handler solo entrega
// el shell HTML inicial y delega el resto al bundle de React.
import handler from "../dist/server/server.js";

export default async function (req, res) {
  // El handler exporta un objeto con .fetch (estilo Web standard)
  const url = `https://${req.headers.host}${req.url}`;
  const init = {
    method: req.method,
    headers: req.headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }
  const webRequest = new Request(url, init);
  const response = await handler.fetch(webRequest);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
