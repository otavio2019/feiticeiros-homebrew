import { createServer } from "node:http";
import app from "../api/trpc/[...trpc].js";

const server = createServer(app);

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Porta de verificação indisponível.");

  const input = encodeURIComponent(JSON.stringify({ json: { timestamp: 0 } }));
  const response = await fetch(`http://127.0.0.1:${address.port}/api/trpc/system.health?input=${input}`);
  const payload = await response.json();

  if (response.status !== 200 || payload?.result?.data?.json?.ok !== true) {
    throw new Error("O bundle da Function não retornou o payload esperado de system.health.");
  }

  console.info("Bundle da Function Vercel verificado com sucesso.");
} finally {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
