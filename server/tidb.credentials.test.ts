import { createPool } from "mysql2/promise";
import { describe, expect, it } from "vitest";
import { getMySqlPoolOptions } from "./database";

describe("TiDB Cloud credentials", () => {
  it("connects to the configured TiDB database without mutating data", async () => {
    const url = process.env.TIDB_DATABASE_URL;
    expect(url).toBeTruthy();

    const pool = createPool(getMySqlPoolOptions(url!));
    try {
      const [rows] = await pool.query("SELECT 1 AS connected");
      expect((rows as Array<{ connected: number }>)[0]?.connected).toBe(1);
    } finally {
      await pool.end();
    }
  }, 15_000);
});
