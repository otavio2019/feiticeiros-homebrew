import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./_core/password";

describe("local password authentication", () => {
  it("hashes a password and verifies only the original value", async () => {
    const hash = await hashPassword("senha-segura-123");
    expect(hash).not.toContain("senha-segura-123");
    expect(await verifyPassword("senha-segura-123", hash)).toBe(true);
    expect(await verifyPassword("senha-incorreta", hash)).toBe(false);
  });

  it("generates different salted hashes for the same password", async () => {
    const first = await hashPassword("senha-segura-123");
    const second = await hashPassword("senha-segura-123");
    expect(first).not.toBe(second);
  });
});
