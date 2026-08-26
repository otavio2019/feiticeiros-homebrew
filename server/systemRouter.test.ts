import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("system.health", () => {
  it("permanece público e responde o payload de saúde esperado", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.system.health({ timestamp: Date.now() })).resolves.toEqual({ ok: true });
  });
});
