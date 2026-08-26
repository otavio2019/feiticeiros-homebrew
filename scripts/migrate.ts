import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "node:path";
import { getDb } from "../server/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL é obrigatório para aplicar migrations.");
}

const database = await getDb();
if (!database) {
  throw new Error("Não foi possível inicializar a conexão com o banco.");
}

try {
  await migrate(database, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  console.info("Migrations aplicadas com sucesso.");
} finally {
  await database.$client.end();
}

process.exit(0);
