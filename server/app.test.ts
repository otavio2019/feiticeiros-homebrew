import type { Server } from "node:http";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp, getDatabaseErrorSummary } from "./app";

describe("createApp", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer(createApp());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Porta de teste indisponível.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("expõe system.health como JSON em /api/trpc", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: { timestamp: 0 } }));
    const response = await fetch(`${baseUrl}/api/trpc/system.health?input=${input}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ result: { data: { json: { ok: true } } } });
  });
});

describe("getDatabaseErrorSummary", () => {
  it("preserva o diagnóstico do driver e remove e-mails e URLs de conexão", () => {
    const error = {
      cause: {
        code: "ER_NO_SUCH_TABLE",
        errno: 1146,
        sqlState: "42S02",
        sqlMessage: "Access denied for user 'db-user'@'10.0.0.1' with otavio@example.com via mysql://user:secret@host/db",
      },
    };

    expect(getDatabaseErrorSummary(error)).toEqual({
      driverCode: "ER_NO_SUCH_TABLE",
      driverErrno: 1146,
      driverSqlState: "42S02",
      driverMessage: "Access denied for database user [redacted] with [email-redacted] via [connection-url-redacted]",
    });
  });

  it("remove consultas SQL completas que possam acompanhar a mensagem do driver", () => {
    const summary = getDatabaseErrorSummary({
      cause: {
        code: "ER_BAD_FIELD_ERROR",
        errno: 1054,
        sqlState: "42S22",
        sqlMessage: "Unknown column 'users.email' in field list. SELECT id, email FROM users WHERE email = 'otavio@example.com'",
      },
    });

    expect(summary?.driverMessage).toBe("Unknown column 'users.email' in field list[sql-redacted]");
    expect(summary?.driverMessage).not.toContain("SELECT id");
    expect(summary?.driverMessage).not.toContain("otavio@example.com");
  });
});
