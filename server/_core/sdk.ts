import { createHmac, randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";

const SESSION_TTL_MS = ONE_YEAR_MS;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET é obrigatório em produção.");
  }
  return "homebrew-forge-development-session-secret";
}

function hashToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

function readSessionToken(req: Request) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[COOKIE_NAME] ?? null;
}

class LocalAuthService {
  async createSession(userId: number, expiresInMs = SESSION_TTL_MS) {
    const token = randomBytes(32).toString("hex");
    await db.createAuthSession(userId, hashToken(token), new Date(Date.now() + expiresInMs));
    return token;
  }

  async destroySession(token: string | null | undefined) {
    if (token) await db.deleteAuthSession(hashToken(token));
  }

  async authenticateRequest(req: Request): Promise<User> {
    const token = readSessionToken(req);
    const user = token ? await db.getUserBySessionTokenHash(hashToken(token)) : undefined;
    if (!user) throw ForbiddenError("Sessão inválida ou expirada.");
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }
}

export const sdk = new LocalAuthService();
export { hashToken, readSessionToken };
export type AuthenticatedUser = User;
