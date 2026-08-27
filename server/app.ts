import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

type ErrorRecord = {
  cause?: unknown;
  code?: unknown;
  errno?: unknown;
  sqlState?: unknown;
  sqlMessage?: unknown;
  message?: unknown;
};

function findDriverError(error: unknown, depth = 0): ErrorRecord | undefined {
  if (!error || typeof error !== "object" || depth > 3) return undefined;
  const record = error as ErrorRecord;
  if (typeof record.errno === "number" || typeof record.sqlState === "string" || typeof record.sqlMessage === "string") {
    return record;
  }
  return findDriverError(record.cause, depth + 1);
}

function sanitizeDriverMessage(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
    .replace(/\b(?:mysql|postgres(?:ql)?):\/\/[^\s]+/gi, "[connection-url-redacted]")
    .replace(/Access denied for user '[^']+'@'[^']+'/gi, "Access denied for database user [redacted]")
    .replace(/(?:\b(?:query|sql)\s*[:=]\s*|(?:^|[.;]\s*)\b(?:select|insert|update|delete|with|alter|create|drop)\b)[\s\S]*/i, "[sql-redacted]")
    .slice(0, 500);
}

export function getDatabaseErrorSummary(error: unknown) {
  const driverError = findDriverError(error);
  if (!driverError) return undefined;

  return {
    driverCode: typeof driverError.code === "string" ? driverError.code : undefined,
    driverErrno: typeof driverError.errno === "number" ? driverError.errno : undefined,
    driverSqlState: typeof driverError.sqlState === "string" ? driverError.sqlState : undefined,
    driverMessage: sanitizeDriverMessage(driverError.sqlMessage ?? driverError.message),
  };
}

/**
 * Monta o backend HTTP sem iniciar uma porta. O mesmo app é usado pelo
 * servidor local e pela Function Node da Vercel.
 */
export function createApp() {
  const app = express();

  // Vercel termina TLS antes de encaminhar a requisição. Confiar no proxy
  // preserva req.protocol e, por consequência, o atributo Secure do cookie.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type }) {
        const databaseError = getDatabaseErrorSummary(error);
        if (databaseError) {
          console.error("[Database Query Error]", JSON.stringify({ path, type, ...databaseError }));
        }
      },
    }),
  );

  return app;
}
