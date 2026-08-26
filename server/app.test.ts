import type { Server } from "node:http";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("createApp", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer(createApp());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Porta de teste indisponível.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("expõe system.health como JSON em /api/trpc", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: { timestamp: 0 } }));
    const response = await fetch(`${baseUrl}/api/trpc/system.health?input=${input}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ result: { data: { json: { ok: true } } } });
  });
});
