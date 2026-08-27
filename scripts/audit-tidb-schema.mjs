import mysql from "mysql2/promise";

const databaseUrl = process.env.TIDB_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TIDB_DATABASE_URL não está definida neste ambiente.");
}

const url = new URL(databaseUrl);
const database = url.pathname.replace(/^\//, "");
const expectedTables = [
  "__drizzle_migrations",
  "authIdentities",
  "authSessions",
  "homebrews",
  "homebrewModules",
  "homebrewElements",
  "homebrewImages",
  "homebrewStructuredElements",
  "structuredAttributeBonuses",
  "structuredRequirements",
  "structuredEffects",
  "structuredCosts",
  "structuredDamageProfiles",
  "structuredRanges",
  "structuredConditions",
  "structuredVowExchanges",
  "structuredEvolutions",
  "structuredWeaponTechniqueLinks",
  "passwordResetTokens",
  "users",
];
const expectedUserColumns = [
  "id",
  "openId",
  "name",
  "email",
  "normalizedEmail",
  "passwordHash",
  "loginMethod",
  "role",
  "createdAt",
  "updatedAt",
  "lastSignedIn",
];

const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database,
  ssl: { minVersion: "TLSv1.2" },
  connectTimeout: 15_000,
});

try {
  const [[identity]] = await connection.query("SELECT DATABASE() AS databaseName, @@hostname AS hostName, VERSION() AS version");
  const [tables] = await connection.query(
    "SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name",
  );
  const [columns] = await connection.query(
    "SELECT column_name AS columnName, column_type AS columnType, is_nullable AS isNullable, column_key AS columnKey FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' ORDER BY ordinal_position",
  );
  const [migrations] = await connection.query(
    "SELECT id, hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at",
  );
  const tableNames = tables.map(row => row.tableName);
  const userColumns = columns.map(column => column.columnName);

  console.log(JSON.stringify({
    connection: { host: url.hostname, port: Number(url.port || 4000), requestedDatabase: database },
    identity,
    tables: tableNames,
    missingExpectedTables: expectedTables.filter(table => !tableNames.includes(table)),
    users: {
      exists: tableNames.includes("users"),
      columns,
      missingExpectedColumns: expectedUserColumns.filter(column => !userColumns.includes(column)),
    },
    drizzleMigrations: migrations.map(migration => ({ id: migration.id, createdAt: migration.createdAt })),
  }, null, 2));

  try {
    const [sample] = await connection.query("SELECT id, email FROM users LIMIT 1");
    console.log(JSON.stringify({ sampleUserQuery: { success: true, rowCount: sample.length } }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      sampleUserQuery: {
        success: false,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        message: error.message,
      },
    }, null, 2));
    process.exitCode = 1;
  }
} finally {
  await connection.end();
}

process.exit(process.exitCode ?? 0);
