// server/app.ts
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";

// server/routers.ts
import { z as z3 } from "zod";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { and, desc, eq, gt, isNull, like, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

// drizzle/schema.ts
import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  normalizedEmail: varchar("normalizedEmail", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var authSessions = mysqlTable(
  "authSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [index("auth_sessions_user_expires_idx").on(table.userId, table.expiresAt)]
);
var passwordResetTokens = mysqlTable(
  "passwordResetTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [uniqueIndex("password_reset_token_hash_unique").on(table.tokenHash)]
);
var authIdentities = mysqlTable(
  "authIdentities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerSubject: varchar("providerSubject", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [uniqueIndex("auth_identity_provider_subject_unique").on(table.provider, table.providerSubject)]
);
var homebrewVisibility = mysqlEnum("homebrewVisibility", ["private", "unlisted", "public"]);
var homebrewStatus = mysqlEnum("homebrewStatus", ["draft", "published"]);
var homebrewModuleType = mysqlEnum("homebrewModuleType", [
  "origem",
  "votos",
  "tecnicas",
  "armas",
  "shikigami",
  "mecanicas",
  "aptidoes",
  "especializacoes",
  "outros"
]);
var homebrewElementType = mysqlEnum("homebrewElementType", [
  "origem",
  "voto",
  "tecnica",
  "feitico",
  "arma",
  "shikigami",
  "mecanica",
  "aptidao",
  "especializacao",
  "outro"
]);
var imageSource = mysqlEnum("imageSource", ["url", "upload"]);
var homebrews = mysqlTable(
  "homebrews",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id),
    title: varchar("title", { length: 160 }).notNull(),
    summary: text("summary").notNull(),
    shareId: varchar("shareId", { length: 32 }).notNull(),
    visibility: homebrewVisibility.notNull().default("private"),
    status: homebrewStatus.notNull().default("draft"),
    characterLevel: int("characterLevel").notNull().default(1),
    manualMode: boolean("manualMode").notNull().default(false),
    coverImageUrl: text("coverImageUrl"),
    data: json("data").$type().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [
    uniqueIndex("homebrews_share_id_unique").on(table.shareId),
    index("homebrews_owner_updated_idx").on(table.ownerId, table.updatedAt)
  ]
);
var homebrewModules = mysqlTable(
  "homebrewModules",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    type: homebrewModuleType.notNull(),
    position: int("position").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    data: json("data").$type().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [index("homebrew_modules_homebrew_position_idx").on(table.homebrewId, table.position)]
);
var homebrewElements = mysqlTable(
  "homebrewElements",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    moduleId: int("moduleId").notNull().references(() => homebrewModules.id),
    parentElementId: int("parentElementId"),
    type: homebrewElementType.notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    position: int("position").notNull().default(0),
    isManual: boolean("isManual").notNull().default(false),
    data: json("data").$type().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [
    index("homebrew_elements_module_position_idx").on(table.moduleId, table.position),
    index("homebrew_elements_homebrew_type_idx").on(table.homebrewId, table.type)
  ]
);
var homebrewImages = mysqlTable(
  "homebrewImages",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    moduleId: int("moduleId"),
    elementId: int("elementId"),
    source: imageSource.notNull(),
    url: text("url").notNull(),
    storageKey: varchar("storageKey", { length: 255 }),
    altText: varchar("altText", { length: 240 }),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [index("homebrew_images_homebrew_idx").on(table.homebrewId)]
);

// server/_core/env.ts
var ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  cookieSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? ""
};

// server/database.ts
function decode(value) {
  return decodeURIComponent(value.replace(/\+/g, "%20"));
}
function getMySqlPoolOptions(databaseUrl) {
  const url = new URL(databaseUrl);
  const isTiDbCloud = url.hostname.endsWith(".tidbcloud.com");
  return {
    host: url.hostname,
    port: Number(url.port || (isTiDbCloud ? 4e3 : 3306)),
    user: decode(url.username),
    password: decode(url.password),
    database: url.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 6e4,
    enableKeepAlive: true,
    ...isTiDbCloud ? { ssl: { minVersion: "TLSv1.2" } } : {}
  };
}

// server/db.ts
var _pool = null;
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool(getMySqlPoolOptions(process.env.DATABASE_URL));
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) return;
  const values = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date() };
  const updateSet = {};
  ["name", "email", "loginMethod"].forEach((field) => {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  updateSet.lastSignedIn = values.lastSignedIn;
  await database.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByEmail(email) {
  const database = await getDb();
  if (!database) return void 0;
  const result = await database.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  return result[0];
}
async function createLocalUser(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const openId = `local_${crypto.randomUUID()}`;
  await database.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    normalizedEmail: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    loginMethod: "password"
  });
  return getUserByOpenId(openId);
}
async function createAuthSession(userId, tokenHash, expiresAt) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.insert(authSessions).values({ userId, tokenHash, expiresAt });
}
async function getUserBySessionTokenHash(tokenHash) {
  const database = await getDb();
  if (!database) return void 0;
  const result = await database.select({ user: users }).from(authSessions).innerJoin(users, eq(authSessions.userId, users.id)).where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, /* @__PURE__ */ new Date()))).limit(1);
  return result[0]?.user;
}
async function deleteAuthSession(tokenHash) {
  const database = await getDb();
  if (!database) return;
  await database.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}
async function createPasswordResetToken(userId, tokenHash, expiresAt) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await database.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
}
async function consumePasswordResetToken(tokenHash) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  return database.transaction(async (tx) => {
    const result = await tx.select({ id: passwordResetTokens.id, user: users }).from(passwordResetTokens).innerJoin(users, eq(passwordResetTokens.userId, users.id)).where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date()), isNull(passwordResetTokens.usedAt))).limit(1);
    const reset = result[0];
    if (!reset) return void 0;
    await tx.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(passwordResetTokens.id, reset.id));
    return reset.user;
  });
}
async function updateUserPasswordAndInvalidateSessions(userId, passwordHash) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, loginMethod: "password", lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
    await tx.delete(authSessions).where(eq(authSessions.userId, userId));
  });
}
async function getUserByOpenId(openId) {
  const database = await getDb();
  if (!database) return void 0;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function listHomebrewsForUser(ownerId, search) {
  const database = await getDb();
  if (!database) return [];
  const filters = [eq(homebrews.ownerId, ownerId)];
  if (search) filters.push(or(like(homebrews.title, `%${search}%`), like(homebrews.summary, `%${search}%`)));
  return database.select().from(homebrews).where(and(...filters)).orderBy(desc(homebrews.updatedAt));
}
async function getHomebrewById(id) {
  const database = await getDb();
  if (!database) return void 0;
  const result = await database.select().from(homebrews).where(eq(homebrews.id, id)).limit(1);
  return result[0];
}
async function getShareableHomebrew(shareId) {
  const database = await getDb();
  if (!database) return void 0;
  const result = await database.select().from(homebrews).where(and(eq(homebrews.shareId, shareId), ne(homebrews.visibility, "private"))).limit(1);
  return result[0];
}
async function getHomebrewDetail(id) {
  const database = await getDb();
  if (!database) return void 0;
  const homebrew = await getHomebrewById(id);
  if (!homebrew) return void 0;
  const [modules, elements, images] = await Promise.all([
    database.select().from(homebrewModules).where(eq(homebrewModules.homebrewId, id)).orderBy(homebrewModules.position),
    database.select().from(homebrewElements).where(eq(homebrewElements.homebrewId, id)).orderBy(homebrewElements.position),
    database.select().from(homebrewImages).where(eq(homebrewImages.homebrewId, id))
  ]);
  return { ...homebrew, modules, elements, images };
}
async function createHomebrew(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const result = await database.insert(homebrews).values({
    ownerId: input.ownerId,
    shareId: input.shareId,
    title: input.title,
    summary: input.summary,
    visibility: input.visibility,
    manualMode: input.manualMode,
    data: { attributes: {}, notes: "" }
  });
  const id = Number(result[0].insertId);
  await database.insert(homebrewModules).values(input.modules.map((type, position) => ({ homebrewId: id, type, position, data: {} })));
  return getHomebrewDetail(id);
}
async function updateHomebrew(id, changes) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.update(homebrews).set(changes).where(eq(homebrews.id, id));
  return getHomebrewDetail(id);
}
async function deleteHomebrew(id) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.delete(homebrewImages).where(eq(homebrewImages.homebrewId, id));
  await database.delete(homebrewElements).where(eq(homebrewElements.homebrewId, id));
  await database.delete(homebrewModules).where(eq(homebrewModules.homebrewId, id));
  await database.delete(homebrews).where(eq(homebrews.id, id));
}
async function duplicateHomebrew(source, ownerId, shareId) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const detail = await getHomebrewDetail(source.id);
  if (!detail) throw new Error("Homebrew original n\xE3o encontrada.");
  const clonedHomebrew = await database.insert(homebrews).values({
    ownerId,
    shareId,
    title: `${source.title} \u2014 c\xF3pia`,
    summary: source.summary,
    visibility: "private",
    manualMode: source.manualMode,
    characterLevel: source.characterLevel,
    coverImageUrl: source.coverImageUrl,
    data: source.data
  });
  const clonedHomebrewId = Number(clonedHomebrew[0].insertId);
  const moduleMap = /* @__PURE__ */ new Map();
  for (const module of detail.modules) {
    const result = await database.insert(homebrewModules).values({
      homebrewId: clonedHomebrewId,
      type: module.type,
      position: module.position,
      enabled: module.enabled,
      data: module.data
    });
    moduleMap.set(module.id, Number(result[0].insertId));
  }
  const elementMap = /* @__PURE__ */ new Map();
  for (const element of detail.elements) {
    const result = await database.insert(homebrewElements).values({
      homebrewId: clonedHomebrewId,
      moduleId: moduleMap.get(element.moduleId),
      type: element.type,
      name: element.name,
      position: element.position,
      isManual: element.isManual,
      data: element.data
    });
    elementMap.set(element.id, Number(result[0].insertId));
  }
  for (const element of detail.elements) {
    if (!element.parentElementId) continue;
    const clonedElementId = elementMap.get(element.id);
    const clonedParentId = elementMap.get(element.parentElementId);
    if (clonedElementId && clonedParentId) {
      await database.update(homebrewElements).set({ parentElementId: clonedParentId }).where(eq(homebrewElements.id, clonedElementId));
    }
  }
  if (detail.images.length) {
    await database.insert(homebrewImages).values(detail.images.map((image) => ({
      homebrewId: clonedHomebrewId,
      moduleId: image.moduleId ? moduleMap.get(image.moduleId) : void 0,
      elementId: image.elementId ? elementMap.get(image.elementId) : void 0,
      source: image.source,
      url: image.url,
      storageKey: image.storageKey,
      altText: image.altText
    })));
  }
  return getHomebrewDetail(clonedHomebrewId);
}
async function addModule(homebrewId, type) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const current = await database.select().from(homebrewModules).where(eq(homebrewModules.homebrewId, homebrewId));
  const result = await database.insert(homebrewModules).values({ homebrewId, type, position: current.length, data: {} });
  return { id: Number(result[0].insertId) };
}
async function addHomebrewImage(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const result = await database.insert(homebrewImages).values({
    homebrewId: input.homebrewId,
    source: input.source,
    url: input.url,
    storageKey: input.storageKey,
    moduleId: input.moduleId,
    elementId: input.elementId,
    altText: input.altText
  });
  return { id: Number(result[0].insertId), url: input.url };
}
async function removeHomebrewImage(homebrewId, imageId) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.delete(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.id, imageId)));
  return { success: true };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    // Frontend e API vivem no mesmo domínio Vercel. "lax" reduz a superfície
    // cross-site e mantém as chamadas tRPC com credentials: include.
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// server/_core/password.ts
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var scrypt = promisify(scryptCallback);
var KEY_LENGTH = 64;
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// server/_core/sdk.ts
import { createHmac, randomBytes as randomBytes2 } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var SESSION_TTL_MS = ONE_YEAR_MS;
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET \xE9 obrigat\xF3rio em produ\xE7\xE3o.");
  }
  return "homebrew-forge-development-session-secret";
}
function hashToken(token) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}
function readSessionToken(req) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[COOKIE_NAME] ?? null;
}
var LocalAuthService = class {
  async createSession(userId, expiresInMs = SESSION_TTL_MS) {
    const token = randomBytes2(32).toString("hex");
    await createAuthSession(userId, hashToken(token), new Date(Date.now() + expiresInMs));
    return token;
  }
  async destroySession(token) {
    if (token) await deleteAuthSession(hashToken(token));
  }
  async authenticateRequest(req) {
    const token = readSessionToken(req);
    const user = token ? await getUserBySessionTokenHash(hashToken(token)) : void 0;
    if (!user) throw ForbiddenError("Sess\xE3o inv\xE1lida ou expirada.");
    await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    return user;
  }
};
var sdk = new LocalAuthService();

// server/mail.ts
import nodemailer from "nodemailer";
function getSmtpConfig(env) {
  const source = env ?? process.env;
  const host = source.SMTP_HOST?.trim();
  const user = source.SMTP_USER?.trim();
  const password = source.SMTP_PASSWORD;
  const from = source.SMTP_FROM?.trim();
  const port = Number(source.SMTP_PORT ?? 587);
  if (!host || !user || !password || !from || !Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP n\xE3o configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e SMTP_FROM.");
  }
  return { host, port, user, password, from, secure: port === 465 };
}
function buildPasswordResetUrl(token, appUrl = process.env.APP_URL) {
  if (!appUrl) throw new Error("APP_URL \xE9 obrigat\xF3rio para enviar links de recupera\xE7\xE3o de senha.");
  const url = new URL("/login", appUrl);
  url.searchParams.set("reset", token);
  return url.toString();
}
async function sendPasswordResetEmail(input) {
  const config = getSmtpConfig();
  const resetUrl = buildPasswordResetUrl(input.token);
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password }
  });
  await transport.sendMail({
    from: config.from,
    to: input.email,
    subject: "Recupere sua senha \u2014 Homebrew Forge",
    text: `Use este link para definir uma nova senha: ${resetUrl}`,
    html: `<p>Use o link abaixo para definir uma nova senha no Homebrew Forge.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>Este link expira em uma hora.</p>`
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(z.object({ timestamp: z.number().min(0, "timestamp cannot be negative") })).query(() => ({ ok: true }))
});

// server/routers/homebrews.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
import { nanoid } from "nanoid";
import { z as z2 } from "zod";

// shared/homebrewRules.ts
var HOME_BREW_MODULES = [
  "origem",
  "votos",
  "tecnicas",
  "armas",
  "shikigami",
  "mecanicas",
  "aptidoes",
  "especializacoes",
  "outros"
];

// server/storage.ts
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary n\xE3o configurado: defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "");
}
function uploadBuffer(buffer, publicId, contentType) {
  return new Promise((resolve, reject) => {
    const upload = getCloudinary().uploader.upload_stream(
      { public_id: publicId, resource_type: "image", overwrite: false, format: contentType.split("/")[1] || void 0 },
      (error, result) => error || !result ? reject(error ?? new Error("Cloudinary n\xE3o retornou o arquivo.")) : resolve(result)
    );
    upload.end(buffer);
  });
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const baseKey = normalizeKey(relKey);
  const key = `${baseKey}_${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const uploaded = await uploadBuffer(buffer, key, contentType);
  return { key: uploaded.public_id, url: uploaded.secure_url };
}

// server/routers/homebrews.ts
var createInput = z2.object({
  title: z2.string().trim().min(3, "Informe um t\xEDtulo com ao menos 3 caracteres.").max(160),
  summary: z2.string().trim().max(800).default(""),
  visibility: z2.enum(["private", "unlisted", "public"]).default("private"),
  manualMode: z2.boolean().default(false),
  modules: z2.array(z2.enum(HOME_BREW_MODULES)).min(1, "Selecione pelo menos um m\xF3dulo.")
});
var updateInput = z2.object({
  id: z2.number().int().positive(),
  title: z2.string().trim().min(3).max(160).optional(),
  summary: z2.string().trim().max(800).optional(),
  visibility: z2.enum(["private", "unlisted", "public"]).optional(),
  manualMode: z2.boolean().optional(),
  coverImageUrl: z2.string().url().nullable().optional(),
  characterLevel: z2.number().int().min(0).max(20).optional(),
  data: z2.record(z2.string(), z2.unknown()).optional()
});
async function assertOwner(homebrewId, userId) {
  const homebrew = await getHomebrewById(homebrewId);
  if (!homebrew) throw new TRPCError2({ code: "NOT_FOUND", message: "Homebrew n\xE3o encontrada." });
  if (homebrew.ownerId !== userId) throw new TRPCError2({ code: "FORBIDDEN", message: "Voc\xEA n\xE3o pode editar esta Homebrew." });
  return homebrew;
}
var homebrewRouter = router({
  list: protectedProcedure.input(z2.object({ search: z2.string().trim().max(120).optional() }).optional()).query(({ ctx, input }) => listHomebrewsForUser(ctx.user.id, input?.search)),
  get: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    return getHomebrewDetail(input.id);
  }),
  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const shareId = nanoid(11);
    return createHomebrew({ ownerId: ctx.user.id, shareId, ...input });
  }),
  update: protectedProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    const { id, ...changes } = input;
    return updateHomebrew(id, changes);
  }),
  remove: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.id, ctx.user.id);
    await deleteHomebrew(input.id);
    return { success: true };
  }),
  duplicate: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const source = await assertOwner(input.id, ctx.user.id);
    return duplicateHomebrew(source, ctx.user.id, nanoid(11));
  }),
  addModule: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), type: z2.enum(HOME_BREW_MODULES) })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    return addModule(input.homebrewId, input.type);
  }),
  addImageUrl: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    url: z2.string().url("Informe uma URL de imagem v\xE1lida."),
    moduleId: z2.number().int().positive().optional(),
    elementId: z2.number().int().positive().optional(),
    altText: z2.string().trim().max(240).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    return addHomebrewImage({ ...input, source: "url" });
  }),
  uploadImage: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    fileName: z2.string().trim().min(1).max(120),
    contentType: z2.enum(["image/jpeg", "image/png", "image/webp"]),
    base64: z2.string().min(1).max(15e5),
    moduleId: z2.number().int().positive().optional(),
    elementId: z2.number().int().positive().optional(),
    altText: z2.string().trim().max(240).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    const bytes = Buffer.from(input.base64, "base64");
    if (bytes.length > 1e6) throw new TRPCError2({ code: "PAYLOAD_TOO_LARGE", message: "Use imagens de at\xE9 1 MB." });
    const extension = input.contentType.split("/")[1] ?? "png";
    const stored = await storagePut(`homebrews/${ctx.user.id}/${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}.${extension}`, bytes, input.contentType);
    return addHomebrewImage({ ...input, source: "upload", url: stored.url, storageKey: stored.key });
  }),
  removeImage: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), imageId: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    return removeHomebrewImage(input.homebrewId, input.imageId);
  }),
  shared: publicProcedure.input(z2.object({ shareId: z2.string().min(6).max(32) })).query(async ({ input }) => {
    const homebrew = await getShareableHomebrew(input.shareId);
    if (!homebrew) throw new TRPCError2({ code: "NOT_FOUND", message: "Esta Homebrew n\xE3o est\xE1 dispon\xEDvel para leitura." });
    return getHomebrewDetail(homebrew.id);
  })
});

// server/routers.ts
var credentialsSchema = z3.object({
  email: z3.string().trim().toLowerCase().email(),
  password: z3.string().min(8).max(128)
});
var passwordResetTtlMs = 60 * 60 * 1e3;
function setSessionCookie(ctx, token) {
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(credentialsSchema.extend({ name: z3.string().trim().min(1).max(120).optional() })).mutation(async ({ input, ctx }) => {
      if (await getUserByEmail(input.email)) throw new Error("Este e-mail j\xE1 est\xE1 cadastrado.");
      const user = await createLocalUser({
        email: input.email,
        name: input.name ?? null,
        passwordHash: await hashPassword(input.password)
      });
      if (!user) throw new Error("N\xE3o foi poss\xEDvel criar o usu\xE1rio.");
      setSessionCookie(ctx, await sdk.createSession(user.id));
      return user;
    }),
    login: publicProcedure.input(credentialsSchema).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user?.passwordHash || !await verifyPassword(input.password, user.passwordHash)) {
        throw new Error("E-mail ou senha inv\xE1lidos.");
      }
      setSessionCookie(ctx, await sdk.createSession(user.id));
      return user;
    }),
    requestPasswordReset: publicProcedure.input(z3.object({ email: z3.string().trim().toLowerCase().email() })).mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) return { success: true };
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      await createPasswordResetToken(user.id, hashToken(token), new Date(Date.now() + passwordResetTtlMs));
      await sendPasswordResetEmail({ email: input.email, token });
      return { success: true };
    }),
    resetPassword: publicProcedure.input(z3.object({ token: z3.string().min(32).max(256), password: z3.string().min(8).max(128) })).mutation(async ({ input }) => {
      const user = await consumePasswordResetToken(hashToken(input.token));
      if (!user) throw new Error("O link de recupera\xE7\xE3o \xE9 inv\xE1lido ou expirou.");
      await updateUserPasswordAndInvalidateSessions(user.id, await hashPassword(input.password));
      return { success: true };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await sdk.destroySession(readSessionToken(ctx.req));
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  homebrew: homebrewRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/app.ts
function createApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(express.json({ limit: "2mb" }));
  app2.use(express.urlencoded({ limit: "2mb", extended: true }));
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// server/vercel.ts
var app = createApp();
var vercel_default = app;
export {
  vercel_default as default
};
