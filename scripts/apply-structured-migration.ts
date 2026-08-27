import { createPool } from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import { getMySqlPoolOptions } from "../server/database";

const url = process.env.TIDB_DATABASE_URL;
if (!url) throw new Error("TIDB_DATABASE_URL é obrigatório.");

const sql = await fs.readFile(path.resolve(process.cwd(), "drizzle/0005_repair_structured_tables.sql"), "utf8");
const statements = sql
  .split(/--> statement-breakpoint/)
  .map(statement => statement.trim())
  .filter(Boolean)
  .map(statement => statement.replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS "));

const pool = createPool(getMySqlPoolOptions(url));
try {
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.info(`Migration estruturada aplicada: ${statements.length} comandos.`);
} finally {
  await pool.end();
}
