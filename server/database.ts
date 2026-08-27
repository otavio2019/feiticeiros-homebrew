import type { PoolOptions } from "mysql2/promise";

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.TIDB_DATABASE_URL ?? env.DATABASE_URL ?? "";
}

function decode(value: string) {
  return decodeURIComponent(value.replace(/\+/g, "%20"));
}

export function getMySqlPoolOptions(databaseUrl: string): PoolOptions {
  const url = new URL(databaseUrl);
  const isTiDbCloud = url.hostname.endsWith(".tidbcloud.com");

  return {
    host: url.hostname,
    port: Number(url.port || (isTiDbCloud ? 4000 : 3306)),
    user: decode(url.username),
    password: decode(url.password),
    database: url.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    ...(isTiDbCloud ? { ssl: { minVersion: "TLSv1.2" } } : {}),
  };
}
