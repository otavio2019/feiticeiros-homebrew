import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import path from "node:path";
import * as schema from "../drizzle/schema";
import { getMySqlPoolOptions } from "../server/database";

const databaseUrl = process.env.TIDB_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TIDB_DATABASE_URL é obrigatório para aplicar migrations no TiDB Cloud.");
}

const pool = createPool(getMySqlPoolOptions(databaseUrl));
const database = drizzle(pool, { schema, mode: "default" });

try {
  await migrate(database, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  console.info("Migrations TiDB aplicadas com sucesso.");
} finally {
  await pool.end();
}

process.exit(0);
