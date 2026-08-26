import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL é obrigatório para verificar o banco.");
}

const database = await getDb();
if (!database) {
  throw new Error("Não foi possível inicializar a conexão com o banco.");
}

try {
  await database.execute(sql`SELECT 1 AS connection_ok`);
  const tables = await database.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name IN ('users', 'homebrews', 'authSessions', 'passwordResetTokens')
  `);
  if (tables[0].length !== 4) {
    throw new Error("O schema Homebrew Forge está incompleto no banco configurado.");
  }
  console.info("Conexão TiDB e tabelas essenciais verificadas com sucesso.");
} finally {
  await database.$client.end();
}

process.exit(0);
