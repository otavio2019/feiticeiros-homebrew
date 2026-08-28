import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

if (!process.env.TIDB_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error("TIDB_DATABASE_URL ou DATABASE_URL é obrigatório para verificar o banco.");
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
      AND table_name IN ('users', 'homebrews', 'authSessions', 'passwordResetTokens', 'shikigamiSheets', 'shikigamiAttributes', 'shikigamiSkills', 'shikigamiOptions', 'shikigamiAbilities')
  `);
  if (tables[0].length !== 9) {
    throw new Error("O schema Homebrew Forge está incompleto no banco configurado.");
  }
  console.info("Conexão TiDB e tabelas essenciais, incluindo Shikigami normalizado, verificadas com sucesso.");
} finally {
  await database.$client.end();
}

process.exit(0);
