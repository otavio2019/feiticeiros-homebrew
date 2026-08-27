// server/app.ts
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
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
  "outro",
  "caracteristica",
  "talento",
  "evolucao",
  "penalidade",
  "propriedade"
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
var structuredRuleSource = mysqlEnum("structuredRuleSource", ["official", "homebrew", "manual"]);
var structuredRequirementType = mysqlEnum("structuredRequirementType", [
  "atributo",
  "nivel",
  "origem",
  "voto",
  "aptidao",
  "especializacao",
  "tecnica",
  "item",
  "condicao",
  "custom"
]);
var structuredEffectType = mysqlEnum("structuredEffectType", ["text", "bonus", "penalty", "condition", "custom"]);
var structuredExchangeKind = mysqlEnum("structuredExchangeKind", ["gain", "loss"]);
var homebrewStructuredElements = mysqlTable(
  "homebrewStructuredElements",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    moduleId: int("moduleId").notNull().references(() => homebrewModules.id),
    parentElementId: int("parentElementId").references(() => homebrewStructuredElements.id),
    legacyElementId: int("legacyElementId"),
    type: homebrewElementType.notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    position: int("position").notNull().default(0),
    isManual: boolean("isManual").notNull().default(false),
    ruleSource: structuredRuleSource.notNull().default("homebrew"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [
    index("structured_elements_homebrew_type_idx").on(table.homebrewId, table.type),
    index("structured_elements_module_position_idx").on(table.moduleId, table.position)
  ]
);
var structuredAttributeBonuses = mysqlTable(
  "structuredAttributeBonuses",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    attribute: varchar("attribute", { length: 64 }).notNull(),
    value: int("value").notNull(),
    position: int("position").notNull().default(0)
  },
  (table) => [index("attribute_bonuses_element_idx").on(table.elementId)]
);
var structuredRequirements = mysqlTable(
  "structuredRequirements",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    type: structuredRequirementType.notNull(),
    operator: varchar("operator", { length: 16 }).notNull().default("gte"),
    valueText: varchar("valueText", { length: 255 }),
    valueNumber: int("valueNumber"),
    position: int("position").notNull().default(0)
  },
  (table) => [index("requirements_element_position_idx").on(table.elementId, table.position)]
);
var structuredEffects = mysqlTable(
  "structuredEffects",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    effectType: structuredEffectType.notNull().default("text"),
    description: text("description").notNull(),
    valueNumber: int("valueNumber"),
    position: int("position").notNull().default(0)
  },
  (table) => [index("effects_element_position_idx").on(table.elementId, table.position)]
);
var structuredCosts = mysqlTable(
  "structuredCosts",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    resource: varchar("resource", { length: 64 }).notNull(),
    amount: int("amount").notNull(),
    details: text("details").notNull(),
    position: int("position").notNull().default(0)
  },
  (table) => [index("costs_element_position_idx").on(table.elementId, table.position)]
);
var structuredDamageProfiles = mysqlTable(
  "structuredDamageProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    dice: varchar("dice", { length: 32 }).notNull(),
    modifier: int("modifier").notNull().default(0),
    damageType: varchar("damageType", { length: 64 }).notNull(),
    scaling: varchar("scaling", { length: 255 }).notNull().default(""),
    details: text("details").notNull()
  },
  (table) => [index("damage_profiles_element_idx").on(table.elementId)]
);
var structuredRanges = mysqlTable(
  "structuredRanges",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    range: int("range").notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    area: varchar("area", { length: 255 }).notNull().default(""),
    target: varchar("target", { length: 255 }).notNull().default("")
  },
  (table) => [index("ranges_element_idx").on(table.elementId)]
);
var structuredConditions = mysqlTable(
  "structuredConditions",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    name: varchar("name", { length: 120 }).notNull(),
    effect: text("effect").notNull(),
    duration: varchar("duration", { length: 120 }).notNull().default(""),
    position: int("position").notNull().default(0)
  },
  (table) => [index("conditions_element_position_idx").on(table.elementId, table.position)]
);
var structuredVowExchanges = mysqlTable(
  "structuredVowExchanges",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    kind: structuredExchangeKind.notNull(),
    description: text("description").notNull(),
    valueNumber: int("valueNumber"),
    position: int("position").notNull().default(0)
  },
  (table) => [index("vow_exchanges_element_kind_idx").on(table.elementId, table.kind, table.position)]
);
var structuredEvolutions = mysqlTable(
  "structuredEvolutions",
  {
    id: int("id").autoincrement().primaryKey(),
    elementId: int("elementId").notNull().references(() => homebrewStructuredElements.id),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    position: int("position").notNull().default(0),
    isManual: boolean("isManual").notNull().default(false),
    ruleSource: structuredRuleSource.notNull().default("homebrew")
  },
  (table) => [index("evolutions_element_position_idx").on(table.elementId, table.position)]
);
var structuredEvolutionUnlocks = mysqlTable(
  "structuredEvolutionUnlocks",
  {
    id: int("id").autoincrement().primaryKey(),
    evolutionElementId: int("evolutionElementId").notNull().references(() => homebrewStructuredElements.id),
    unlockedElementId: int("unlockedElementId").notNull().references(() => homebrewStructuredElements.id)
  },
  (table) => [
    uniqueIndex("evolution_unlock_unique").on(table.evolutionElementId, table.unlockedElementId),
    index("evolution_unlock_evolution_idx").on(table.evolutionElementId)
  ]
);
var structuredWeaponTechniqueLinks = mysqlTable(
  "structuredWeaponTechniqueLinks",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    weaponElementId: int("weaponElementId").notNull().references(() => homebrewStructuredElements.id),
    techniqueElementId: int("techniqueElementId").notNull().references(() => homebrewStructuredElements.id),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [uniqueIndex("weapon_technique_link_unique").on(table.weaponElementId, table.techniqueElementId)]
);

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
var STRUCTURED_DAMAGE_TYPES = [
  { value: "cortante", label: "Cortante" },
  { value: "perfurante", label: "Perfurante" },
  { value: "impacto", label: "Impacto" },
  { value: "acido", label: "\xC1cido" },
  { value: "congelante", label: "Congelante" },
  { value: "chocante", label: "Chocante" },
  { value: "queimante", label: "Queimante" },
  { value: "sonico", label: "S\xF4nico" },
  { value: "alma", label: "na Alma" },
  { value: "energia-reversa", label: "Energia Reversa" },
  { value: "energetico", label: "Energ\xE9tico" },
  { value: "psiquico", label: "Ps\xEDquico" },
  { value: "radiante", label: "Radiante" },
  { value: "necrotico", label: "Necr\xF3tico" },
  { value: "venenoso", label: "Venenoso" }
];
var STRUCTURED_DAMAGE_TYPE_VALUES = STRUCTURED_DAMAGE_TYPES.map((item) => item.value);
function validateStructuredMechanics(input, manualMode = false) {
  const errors = [];
  for (const requirement of input.requirements ?? []) {
    if (!requirement.type.trim()) errors.push("Requisito sem tipo.");
    if (requirement.valueText == null && requirement.valueNumber == null) errors.push("Requisito sem valor.");
  }
  for (const bonus of input.attributeBonuses ?? []) {
    if (!bonus.attribute.trim()) errors.push("B\xF4nus sem atributo.");
    if (!Number.isInteger(bonus.value)) errors.push("B\xF4nus com valor inv\xE1lido.");
  }
  for (const effect of input.effects ?? []) {
    if (!effect.description.trim()) errors.push("Efeito sem descri\xE7\xE3o.");
  }
  return { valid: manualMode || errors.length === 0, errors };
}
function validateStructuredExtendedMechanics(input, manualMode = false) {
  const errors = [];
  for (const cost of input.costs ?? []) {
    if (!cost.resource.trim()) errors.push("Custo sem recurso.");
    if (!Number.isInteger(cost.amount) || cost.amount < 0) errors.push("Custo com quantidade inv\xE1lida.");
    if (!cost.details.trim()) errors.push("Custo sem detalhes.");
  }
  for (const damage of input.damageProfiles ?? []) {
    if (!damage.dice.trim()) errors.push("Perfil de dano sem dados.");
    if (!damage.damageType.trim()) errors.push("Perfil de dano sem tipo.");
    if (!damage.details.trim()) errors.push("Perfil de dano sem detalhes.");
  }
  for (const range of input.ranges ?? []) {
    if (!Number.isInteger(range.range) || range.range < 0) errors.push("Alcance inv\xE1lido.");
    if (!range.unit.trim()) errors.push("Alcance sem unidade.");
  }
  for (const condition of input.conditions ?? []) {
    if (!condition.name.trim()) errors.push("Condi\xE7\xE3o sem nome.");
    if (!condition.effect.trim()) errors.push("Condi\xE7\xE3o sem efeito.");
  }
  for (const exchange of input.vowExchanges ?? []) {
    if (exchange.kind !== "gain" && exchange.kind !== "loss") errors.push("Troca de Voto sem tipo v\xE1lido.");
    if (!exchange.description.trim()) errors.push("Ganho ou perda de Voto sem descri\xE7\xE3o.");
    if (exchange.valueNumber != null && !Number.isInteger(exchange.valueNumber)) errors.push("Troca de Voto com valor num\xE9rico inv\xE1lido.");
  }
  for (const evolution of input.evolutions ?? []) {
    if (!evolution.name.trim()) errors.push("Evolu\xE7\xE3o sem nome.");
    if (!evolution.description.trim()) errors.push("Evolu\xE7\xE3o sem descri\xE7\xE3o.");
  }
  return { valid: manualMode || errors.length === 0, errors };
}

// server/database.ts
function getDatabaseUrl(env = process.env) {
  return env.TIDB_DATABASE_URL ?? env.DATABASE_URL ?? "";
}
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

// server/_core/env.ts
var ENV = {
  databaseUrl: getDatabaseUrl(),
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

// server/db.ts
var _pool = null;
var _db = null;
async function getDb() {
  const databaseUrl = getDatabaseUrl();
  if (!_db && databaseUrl) {
    try {
      _pool = createPool(getMySqlPoolOptions(databaseUrl));
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
  try {
    const result = await database.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
    return result[0];
  } catch (error) {
    if (String(error?.message ?? "").toLowerCase().includes("normalizedemail")) {
      const result = await database.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
      const legacyUser = result[0];
      return legacyUser ? {
        id: legacyUser.id,
        openId: `legacy-${legacyUser.id}`,
        name: null,
        email: legacyUser.email,
        normalizedEmail: null,
        passwordHash: null,
        loginMethod: null,
        role: "user",
        createdAt: /* @__PURE__ */ new Date(0),
        updatedAt: /* @__PURE__ */ new Date(0),
        lastSignedIn: /* @__PURE__ */ new Date(0)
      } : void 0;
    }
    throw error;
  }
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
  const structuredIds = await database.select({ id: homebrewStructuredElements.id }).from(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, id));
  for (const row of structuredIds) {
    await database.delete(structuredWeaponTechniqueLinks).where(or(eq(structuredWeaponTechniqueLinks.weaponElementId, row.id), eq(structuredWeaponTechniqueLinks.techniqueElementId, row.id)));
    await database.delete(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, row.id));
    await database.delete(structuredRequirements).where(eq(structuredRequirements.elementId, row.id));
    await database.delete(structuredEffects).where(eq(structuredEffects.elementId, row.id));
    await database.delete(structuredCosts).where(eq(structuredCosts.elementId, row.id));
    await database.delete(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, row.id));
    await database.delete(structuredRanges).where(eq(structuredRanges.elementId, row.id));
    await database.delete(structuredConditions).where(eq(structuredConditions.elementId, row.id));
    await database.delete(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, row.id));
    await database.delete(structuredEvolutions).where(eq(structuredEvolutions.elementId, row.id));
  }
  await database.delete(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, id));
  await database.delete(homebrewImages).where(eq(homebrewImages.homebrewId, id));
  await database.delete(homebrewElements).where(eq(homebrewElements.homebrewId, id));
  await database.delete(homebrewModules).where(eq(homebrewModules.homebrewId, id));
  await database.delete(homebrews).where(eq(homebrews.id, id));
}
async function duplicateStructuredEntities(database, sourceHomebrewId, clonedHomebrewId, moduleMap, legacyElementMap) {
  const sourceElements = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, sourceHomebrewId));
  const structuredElementMap = /* @__PURE__ */ new Map();
  for (const element of sourceElements) {
    const clonedModuleId = moduleMap.get(element.moduleId);
    if (!clonedModuleId) continue;
    const result = await database.insert(homebrewStructuredElements).values({
      homebrewId: clonedHomebrewId,
      moduleId: clonedModuleId,
      parentElementId: null,
      legacyElementId: element.legacyElementId ? legacyElementMap.get(element.legacyElementId) ?? null : null,
      type: element.type,
      name: element.name,
      description: element.description,
      position: element.position,
      isManual: element.isManual,
      ruleSource: element.ruleSource
    });
    structuredElementMap.set(element.id, Number(result[0].insertId));
  }
  for (const element of sourceElements) {
    const clonedElementId = structuredElementMap.get(element.id);
    const clonedParentId = element.parentElementId ? structuredElementMap.get(element.parentElementId) : void 0;
    if (clonedElementId && clonedParentId) {
      await database.update(homebrewStructuredElements).set({ parentElementId: clonedParentId }).where(eq(homebrewStructuredElements.id, clonedElementId));
    }
  }
  for (const element of sourceElements) {
    const clonedElementId = structuredElementMap.get(element.id);
    if (!clonedElementId) continue;
    const [attributeBonuses, requirements, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions] = await Promise.all([
      database.select().from(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, element.id)),
      database.select().from(structuredRequirements).where(eq(structuredRequirements.elementId, element.id)),
      database.select().from(structuredEffects).where(eq(structuredEffects.elementId, element.id)),
      database.select().from(structuredCosts).where(eq(structuredCosts.elementId, element.id)),
      database.select().from(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, element.id)),
      database.select().from(structuredRanges).where(eq(structuredRanges.elementId, element.id)),
      database.select().from(structuredConditions).where(eq(structuredConditions.elementId, element.id)),
      database.select().from(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, element.id)),
      database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, element.id))
    ]);
    if (attributeBonuses.length) await database.insert(structuredAttributeBonuses).values(attributeBonuses.map((item) => ({ elementId: clonedElementId, attribute: item.attribute, value: item.value, position: item.position })));
    if (requirements.length) await database.insert(structuredRequirements).values(requirements.map((item) => ({ elementId: clonedElementId, type: item.type, operator: item.operator, valueText: item.valueText, valueNumber: item.valueNumber, position: item.position })));
    if (effects.length) await database.insert(structuredEffects).values(effects.map((item) => ({ elementId: clonedElementId, effectType: item.effectType, description: item.description, valueNumber: item.valueNumber, position: item.position })));
    if (costs.length) await database.insert(structuredCosts).values(costs.map((item) => ({ elementId: clonedElementId, resource: item.resource, amount: item.amount, details: item.details, position: item.position })));
    if (damageProfiles.length) await database.insert(structuredDamageProfiles).values(damageProfiles.map((item) => ({ elementId: clonedElementId, dice: item.dice, modifier: item.modifier, damageType: item.damageType, scaling: item.scaling, details: item.details })));
    if (ranges.length) await database.insert(structuredRanges).values(ranges.map((item) => ({ elementId: clonedElementId, range: item.range, unit: item.unit, area: item.area, target: item.target })));
    if (conditions.length) await database.insert(structuredConditions).values(conditions.map((item) => ({ elementId: clonedElementId, name: item.name, effect: item.effect, duration: item.duration, position: item.position })));
    if (vowExchanges.length) await database.insert(structuredVowExchanges).values(vowExchanges.map((item) => ({ elementId: clonedElementId, kind: item.kind, description: item.description, valueNumber: item.valueNumber, position: item.position })));
    if (evolutions.length) await database.insert(structuredEvolutions).values(evolutions.map((item) => ({ elementId: clonedElementId, name: item.name, description: item.description, position: item.position, isManual: item.isManual, ruleSource: item.ruleSource })));
  }
  const links = await database.select().from(structuredWeaponTechniqueLinks).where(eq(structuredWeaponTechniqueLinks.homebrewId, sourceHomebrewId));
  for (const link of links) {
    const weaponElementId = structuredElementMap.get(link.weaponElementId);
    const techniqueElementId = structuredElementMap.get(link.techniqueElementId);
    if (weaponElementId && techniqueElementId) await database.insert(structuredWeaponTechniqueLinks).values({ homebrewId: clonedHomebrewId, weaponElementId, techniqueElementId });
  }
  const evolutionUnlocks = await database.select().from(structuredEvolutionUnlocks).innerJoin(homebrewStructuredElements, eq(structuredEvolutionUnlocks.evolutionElementId, homebrewStructuredElements.id)).where(eq(homebrewStructuredElements.homebrewId, sourceHomebrewId));
  for (const row of evolutionUnlocks) {
    const evolutionElementId = structuredElementMap.get(row.structuredEvolutionUnlocks.evolutionElementId);
    const unlockedElementId = structuredElementMap.get(row.structuredEvolutionUnlocks.unlockedElementId);
    if (evolutionElementId && unlockedElementId) await database.insert(structuredEvolutionUnlocks).values({ evolutionElementId, unlockedElementId });
  }
  return structuredElementMap;
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
  const structuredElementMap = await duplicateStructuredEntities(database, source.id, clonedHomebrewId, moduleMap, elementMap);
  if (detail.images.length) {
    await database.insert(homebrewImages).values(detail.images.map((image) => ({
      homebrewId: clonedHomebrewId,
      moduleId: image.moduleId ? moduleMap.get(image.moduleId) : void 0,
      elementId: image.elementId ? structuredElementMap.get(image.elementId) ?? elementMap.get(image.elementId) : void 0,
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
async function listStructuredElements(homebrewId, moduleId, parentElementId) {
  const database = await getDb();
  if (!database) return [];
  const filters = [
    eq(homebrewStructuredElements.homebrewId, homebrewId),
    parentElementId ? eq(homebrewStructuredElements.parentElementId, parentElementId) : isNull(homebrewStructuredElements.parentElementId)
  ];
  if (moduleId) filters.push(eq(homebrewStructuredElements.moduleId, moduleId));
  const elements = await database.select().from(homebrewStructuredElements).where(and(...filters)).orderBy(homebrewStructuredElements.position);
  return Promise.all(elements.map(async (element) => ({
    ...element,
    images: await database.select().from(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.elementId, element.id)))
  })));
}
async function assertStructuredElementForHomebrew(homebrewId, elementId) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const rows = await database.select().from(homebrewStructuredElements).where(and(eq(homebrewStructuredElements.id, elementId), eq(homebrewStructuredElements.homebrewId, homebrewId))).limit(1);
  if (!rows[0]) throw new Error("Elemento estruturado n\xE3o pertence a esta Homebrew.");
  return rows[0];
}
async function assertWeaponTechniqueLinkForHomebrew(homebrewId, linkId) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const rows = await database.select().from(structuredWeaponTechniqueLinks).where(and(eq(structuredWeaponTechniqueLinks.id, linkId), eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId))).limit(1);
  if (!rows[0]) throw new Error("V\xEDnculo Arma\u2013T\xE9cnica n\xE3o pertence a esta Homebrew.");
  return rows[0];
}
async function createStructuredElement(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const moduleRows = await database.select({ id: homebrewModules.id }).from(homebrewModules).where(and(eq(homebrewModules.id, input.moduleId), eq(homebrewModules.homebrewId, input.homebrewId))).limit(1);
  if (!moduleRows[0]) throw new Error("M\xF3dulo n\xE3o pertence a esta Homebrew.");
  if (input.parentElementId) {
    const parentRows = await database.select({ id: homebrewStructuredElements.id }).from(homebrewStructuredElements).where(and(eq(homebrewStructuredElements.id, input.parentElementId), eq(homebrewStructuredElements.homebrewId, input.homebrewId), eq(homebrewStructuredElements.moduleId, input.moduleId))).limit(1);
    if (!parentRows[0]) throw new Error("Elemento pai n\xE3o pertence a este m\xF3dulo da Homebrew.");
  }
  const result = await database.insert(homebrewStructuredElements).values({
    homebrewId: input.homebrewId,
    moduleId: input.moduleId,
    parentElementId: input.parentElementId ?? null,
    type: input.type,
    name: input.name,
    description: input.description,
    ruleSource: input.ruleSource ?? "homebrew",
    isManual: input.isManual ?? false,
    position: input.position ?? 0
  });
  const id = Number(result[0].insertId);
  const rows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id));
  return rows[0];
}
async function updateStructuredElement(id, input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const currentRows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1);
  const current = currentRows[0];
  if (!current) throw new Error("Elemento estruturado n\xE3o encontrado.");
  if (input.parentElementId) {
    if (input.parentElementId === id) throw new Error("Um elemento n\xE3o pode ser pai de si mesmo.");
    const parentRows = await database.select({ id: homebrewStructuredElements.id }).from(homebrewStructuredElements).where(and(eq(homebrewStructuredElements.id, input.parentElementId), eq(homebrewStructuredElements.homebrewId, current.homebrewId), eq(homebrewStructuredElements.moduleId, input.moduleId ?? current.moduleId))).limit(1);
    if (!parentRows[0]) throw new Error("Elemento pai n\xE3o pertence ao mesmo m\xF3dulo da Homebrew.");
  }
  await database.update(homebrewStructuredElements).set(input).where(eq(homebrewStructuredElements.id, id));
  const rows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id));
  return rows[0];
}
async function deleteStructuredElement(id) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const elementRows = await database.select({ homebrewId: homebrewStructuredElements.homebrewId }).from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1);
  const element = elementRows[0];
  const removeElementTree = async (tx, elementId) => {
    const children = await tx.select({ id: homebrewStructuredElements.id }).from(homebrewStructuredElements).where(eq(homebrewStructuredElements.parentElementId, elementId));
    for (const child of children) await removeElementTree(tx, child.id);
    await tx.delete(structuredWeaponTechniqueLinks).where(or(eq(structuredWeaponTechniqueLinks.weaponElementId, elementId), eq(structuredWeaponTechniqueLinks.techniqueElementId, elementId)));
    await tx.delete(homebrewImages).where(eq(homebrewImages.elementId, elementId));
    await tx.delete(structuredRequirements).where(eq(structuredRequirements.elementId, elementId));
    await tx.delete(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, elementId));
    await tx.delete(structuredEffects).where(eq(structuredEffects.elementId, elementId));
    await tx.delete(structuredCosts).where(eq(structuredCosts.elementId, elementId));
    await tx.delete(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, elementId));
    await tx.delete(structuredRanges).where(eq(structuredRanges.elementId, elementId));
    await tx.delete(structuredConditions).where(eq(structuredConditions.elementId, elementId));
    await tx.delete(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, elementId));
    await tx.delete(structuredEvolutions).where(eq(structuredEvolutions.elementId, elementId));
    await tx.delete(structuredEvolutionUnlocks).where(or(eq(structuredEvolutionUnlocks.evolutionElementId, elementId), eq(structuredEvolutionUnlocks.unlockedElementId, elementId)));
    await tx.delete(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, elementId));
  };
  await database.transaction(async (tx) => {
    await removeElementTree(tx, id);
  });
  return { id, homebrewId: element?.homebrewId };
}
async function replaceStructuredMechanics(elementId, input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const validation = validateStructuredMechanics(input);
  if (!validation.valid) throw new Error(`Dados mec\xE2nicos inv\xE1lidos: ${validation.errors.join(" ")}`);
  await database.transaction(async (tx) => {
    await tx.delete(structuredRequirements).where(eq(structuredRequirements.elementId, elementId));
    await tx.delete(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, elementId));
    await tx.delete(structuredEffects).where(eq(structuredEffects.elementId, elementId));
    if (input.requirements?.length) await tx.insert(structuredRequirements).values(input.requirements.map((item, position) => ({ elementId, type: item.type, operator: item.operator ?? "gte", valueText: item.valueText ?? null, valueNumber: item.valueNumber ?? null, position })));
    if (input.attributeBonuses?.length) await tx.insert(structuredAttributeBonuses).values(input.attributeBonuses.map((item, position) => ({ elementId, attribute: item.attribute, value: item.value, position })));
    if (input.effects?.length) await tx.insert(structuredEffects).values(input.effects.map((item, position) => ({ elementId, effectType: item.effectType ?? "text", description: item.description, valueNumber: item.valueNumber ?? null, position })));
  });
  return { elementId };
}
async function getStructuredMechanics(elementId) {
  const database = await getDb();
  if (!database) return { requirements: [], attributeBonuses: [], effects: [] };
  const [requirements, attributeBonuses, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions] = await Promise.all([
    database.select().from(structuredRequirements).where(eq(structuredRequirements.elementId, elementId)).orderBy(structuredRequirements.position),
    database.select().from(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, elementId)),
    database.select().from(structuredEffects).where(eq(structuredEffects.elementId, elementId)).orderBy(structuredEffects.position),
    database.select().from(structuredCosts).where(eq(structuredCosts.elementId, elementId)).orderBy(structuredCosts.position),
    database.select().from(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, elementId)),
    database.select().from(structuredRanges).where(eq(structuredRanges.elementId, elementId)),
    database.select().from(structuredConditions).where(eq(structuredConditions.elementId, elementId)).orderBy(structuredConditions.position),
    database.select().from(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, elementId)).orderBy(structuredVowExchanges.position),
    database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, elementId)).orderBy(structuredEvolutions.position)
  ]);
  return { requirements, attributeBonuses, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions };
}
async function createWeaponTechniqueLink(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const [weapon, technique] = await Promise.all([assertStructuredElementForHomebrew(input.homebrewId, input.weaponElementId), assertStructuredElementForHomebrew(input.homebrewId, input.techniqueElementId)]);
  if (weapon.type !== "arma" || technique.type !== "tecnica") throw new Error("O v\xEDnculo exige uma Arma e uma T\xE9cnica da mesma Homebrew.");
  await database.insert(structuredWeaponTechniqueLinks).values(input);
  return input;
}
async function listWeaponTechniqueLinks(homebrewId) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(structuredWeaponTechniqueLinks).where(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId));
}
async function deleteWeaponTechniqueLink(homebrewId, id) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await database.delete(structuredWeaponTechniqueLinks).where(and(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId), eq(structuredWeaponTechniqueLinks.id, id)));
  return { id };
}
async function updateWeaponTechniqueLink(input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  await assertWeaponTechniqueLinkForHomebrew(input.homebrewId, input.id);
  const [weapon, technique] = await Promise.all([assertStructuredElementForHomebrew(input.homebrewId, input.weaponElementId), assertStructuredElementForHomebrew(input.homebrewId, input.techniqueElementId)]);
  if (weapon.type !== "arma" || technique.type !== "tecnica") throw new Error("O v\xEDnculo exige uma Arma e uma T\xE9cnica da mesma Homebrew.");
  const { id, homebrewId, ...changes } = input;
  await database.update(structuredWeaponTechniqueLinks).set(changes).where(and(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId), eq(structuredWeaponTechniqueLinks.id, id)));
  return input;
}
async function listEvolutionUnlocks(homebrewId, evolutionElementId) {
  const database = await getDb();
  if (!database) return [];
  const evolution = await assertStructuredElementForHomebrew(homebrewId, evolutionElementId);
  if (evolution.type !== "evolucao") throw new Error("O elemento informado n\xE3o \xE9 uma Evolu\xE7\xE3o.");
  return database.select().from(structuredEvolutionUnlocks).where(eq(structuredEvolutionUnlocks.evolutionElementId, evolutionElementId));
}
async function replaceEvolutionUnlocks(homebrewId, evolutionElementId, unlockedElementIds) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const evolution = await assertStructuredElementForHomebrew(homebrewId, evolutionElementId);
  if (evolution.type !== "evolucao") throw new Error("O elemento informado n\xE3o \xE9 uma Evolu\xE7\xE3o.");
  const uniqueIds = Array.from(new Set(unlockedElementIds));
  for (const unlockedElementId of uniqueIds) {
    const target = await assertStructuredElementForHomebrew(homebrewId, unlockedElementId);
    if (target.parentElementId !== evolution.parentElementId || !["caracteristica", "talento"].includes(target.type)) throw new Error("Uma Evolu\xE7\xE3o s\xF3 pode liberar Caracter\xEDsticas ou Talentos da mesma Origem.");
  }
  await database.transaction(async (tx) => {
    await tx.delete(structuredEvolutionUnlocks).where(eq(structuredEvolutionUnlocks.evolutionElementId, evolutionElementId));
    if (uniqueIds.length) await tx.insert(structuredEvolutionUnlocks).values(uniqueIds.map((unlockedElementId) => ({ evolutionElementId, unlockedElementId })));
  });
  return listEvolutionUnlocks(homebrewId, evolutionElementId);
}
async function listStructuredElementsForShare(homebrewId) {
  const database = await getDb();
  if (!database) return [];
  const elements = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, homebrewId)).orderBy(homebrewStructuredElements.position);
  return Promise.all(elements.map(async (element) => {
    const [attributeBonuses, requirements, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions, evolutionUnlocks, images] = await Promise.all([
      database.select().from(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, element.id)),
      database.select().from(structuredRequirements).where(eq(structuredRequirements.elementId, element.id)).orderBy(structuredRequirements.position),
      database.select().from(structuredEffects).where(eq(structuredEffects.elementId, element.id)).orderBy(structuredEffects.position),
      database.select().from(structuredCosts).where(eq(structuredCosts.elementId, element.id)).orderBy(structuredCosts.position),
      database.select().from(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, element.id)),
      database.select().from(structuredRanges).where(eq(structuredRanges.elementId, element.id)),
      database.select().from(structuredConditions).where(eq(structuredConditions.elementId, element.id)).orderBy(structuredConditions.position),
      database.select().from(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, element.id)).orderBy(structuredVowExchanges.position),
      database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, element.id)).orderBy(structuredEvolutions.position),
      database.select().from(structuredEvolutionUnlocks).where(eq(structuredEvolutionUnlocks.evolutionElementId, element.id)),
      database.select().from(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.elementId, element.id)))
    ]);
    return { ...element, images, mechanics: { attributeBonuses, requirements, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions, evolutionUnlocks } };
  }));
}
async function reorderStructuredElement(id, direction) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const currentRows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1);
  const current = currentRows[0];
  if (!current) return void 0;
  const siblingFilter = current.parentElementId ? eq(homebrewStructuredElements.parentElementId, current.parentElementId) : isNull(homebrewStructuredElements.parentElementId);
  const rows = await database.select().from(homebrewStructuredElements).where(and(eq(homebrewStructuredElements.homebrewId, current.homebrewId), eq(homebrewStructuredElements.moduleId, current.moduleId), siblingFilter)).orderBy(homebrewStructuredElements.position);
  const index2 = rows.findIndex((row) => row.id === id);
  const targetIndex = direction === "up" ? index2 - 1 : index2 + 1;
  if (index2 < 0 || !rows[targetIndex]) return current;
  const target = rows[targetIndex];
  await database.transaction(async (tx) => {
    await tx.update(homebrewStructuredElements).set({ position: target.position }).where(eq(homebrewStructuredElements.id, current.id));
    await tx.update(homebrewStructuredElements).set({ position: current.position }).where(eq(homebrewStructuredElements.id, target.id));
  });
  return (await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1))[0];
}
async function replaceStructuredExtendedMechanics(elementId, input) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indispon\xEDvel.");
  const validation = validateStructuredExtendedMechanics(input);
  if (!validation.valid) throw new Error(`Dados mec\xE2nicos estendidos inv\xE1lidos: ${validation.errors.join(" ")}`);
  await database.transaction(async (tx) => {
    await tx.delete(structuredCosts).where(eq(structuredCosts.elementId, elementId));
    await tx.delete(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, elementId));
    await tx.delete(structuredRanges).where(eq(structuredRanges.elementId, elementId));
    await tx.delete(structuredConditions).where(eq(structuredConditions.elementId, elementId));
    await tx.delete(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, elementId));
    await tx.delete(structuredEvolutions).where(eq(structuredEvolutions.elementId, elementId));
    if (input.costs?.length) await tx.insert(structuredCosts).values(input.costs.map((item, position) => ({ elementId, resource: item.resource, amount: item.amount, details: item.details, position })));
    if (input.damageProfiles?.length) await tx.insert(structuredDamageProfiles).values(input.damageProfiles.map((item) => ({ elementId, dice: item.dice, modifier: item.modifier ?? 0, damageType: item.damageType, scaling: item.scaling ?? "", details: item.details })));
    if (input.ranges?.length) await tx.insert(structuredRanges).values(input.ranges.map((item) => ({ elementId, range: item.range, unit: item.unit, area: item.area ?? "", target: item.target ?? "" })));
    if (input.conditions?.length) await tx.insert(structuredConditions).values(input.conditions.map((item, position) => ({ elementId, name: item.name, effect: item.effect, duration: item.duration ?? "", position })));
    if (input.vowExchanges?.length) await tx.insert(structuredVowExchanges).values(input.vowExchanges.map((item, position) => ({ elementId, kind: item.kind, description: item.description, valueNumber: item.valueNumber ?? null, position })));
    if (input.evolutions?.length) await tx.insert(structuredEvolutions).values(input.evolutions.map((item, position) => ({ elementId, name: item.name, description: item.description, position, isManual: item.isManual ?? false, ruleSource: item.ruleSource ?? "homebrew" })));
  });
  return { elementId };
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
    if (input.elementId) await assertStructuredElementForHomebrew(input.homebrewId, input.elementId);
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
    if (input.elementId) await assertStructuredElementForHomebrew(input.homebrewId, input.elementId);
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
    const detail = await getHomebrewDetail(homebrew.id);
    if (!detail) throw new TRPCError2({ code: "NOT_FOUND", message: "Esta Homebrew n\xE3o est\xE1 dispon\xEDvel para leitura." });
    const structured = await listStructuredElementsForShare(homebrew.id);
    return { ...detail, structured };
  }),
  structuredList: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), moduleId: z2.number().int().positive().optional(), parentElementId: z2.number().int().positive().nullable().optional() })).query(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    return listStructuredElements(input.homebrewId, input.moduleId, input.parentElementId);
  }),
  structuredCreate: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    moduleId: z2.number().int().positive(),
    type: z2.enum(["origem", "shikigami", "voto", "tecnica", "feitico", "arma", "mecanica", "aptidao", "especializacao", "outro", "caracteristica", "talento", "evolucao", "penalidade", "propriedade"]),
    name: z2.string().trim().min(1).max(160),
    description: z2.string().trim().min(1),
    parentElementId: z2.number().int().positive().nullable().optional(),
    ruleSource: z2.enum(["official", "homebrew", "manual"]).optional(),
    isManual: z2.boolean().default(false),
    position: z2.number().int().min(0).default(0)
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    if (input.parentElementId) await assertStructuredElementForHomebrew(input.homebrewId, input.parentElementId);
    return createStructuredElement(input);
  }),
  structuredUpdate: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    id: z2.number().int().positive(),
    moduleId: z2.number().int().positive().optional(),
    type: z2.enum(["origem", "shikigami", "voto", "tecnica", "feitico", "arma", "mecanica", "aptidao", "especializacao", "outro", "caracteristica", "talento", "evolucao", "penalidade", "propriedade"]).optional(),
    name: z2.string().trim().min(1).max(160).optional(),
    description: z2.string().trim().min(1).optional(),
    parentElementId: z2.number().int().positive().nullable().optional(),
    ruleSource: z2.enum(["official", "homebrew", "manual"]).optional(),
    isManual: z2.boolean().optional(),
    position: z2.number().int().min(0).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.id);
    if (input.parentElementId) await assertStructuredElementForHomebrew(input.homebrewId, input.parentElementId);
    const { id, homebrewId: _homebrewId, ...changes } = input;
    return updateStructuredElement(id, changes);
  }),
  structuredDelete: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.id);
    return deleteStructuredElement(input.id);
  }),
  structuredReorder: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), id: z2.number().int().positive(), direction: z2.enum(["up", "down"]) })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.id);
    return reorderStructuredElement(input.id, input.direction);
  }),
  structuredMechanics: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), elementId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.elementId);
    return getStructuredMechanics(input.elementId);
  }),
  structuredWeaponTechniqueLinks: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    return listWeaponTechniqueLinks(input.homebrewId);
  }),
  structuredWeaponTechniqueLinkCreate: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), weaponElementId: z2.number().int().positive(), techniqueElementId: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.weaponElementId);
    await assertStructuredElementForHomebrew(input.homebrewId, input.techniqueElementId);
    return createWeaponTechniqueLink(input);
  }),
  structuredWeaponTechniqueLinkDelete: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertWeaponTechniqueLinkForHomebrew(input.homebrewId, input.id);
    return deleteWeaponTechniqueLink(input.homebrewId, input.id);
  }),
  structuredWeaponTechniqueLinkUpdate: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), id: z2.number().int().positive(), weaponElementId: z2.number().int().positive(), techniqueElementId: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertWeaponTechniqueLinkForHomebrew(input.homebrewId, input.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.weaponElementId);
    await assertStructuredElementForHomebrew(input.homebrewId, input.techniqueElementId);
    return updateWeaponTechniqueLink(input);
  }),
  structuredEvolutionUnlocks: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), evolutionElementId: z2.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.evolutionElementId);
    return listEvolutionUnlocks(input.homebrewId, input.evolutionElementId);
  }),
  structuredEvolutionUnlocksReplace: protectedProcedure.input(z2.object({ homebrewId: z2.number().int().positive(), evolutionElementId: z2.number().int().positive(), unlockedElementIds: z2.array(z2.number().int().positive()).max(100) })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.evolutionElementId);
    for (const unlockedElementId of input.unlockedElementIds) await assertStructuredElementForHomebrew(input.homebrewId, unlockedElementId);
    return replaceEvolutionUnlocks(input.homebrewId, input.evolutionElementId, input.unlockedElementIds);
  }),
  structuredSaveExtendedMechanics: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    elementId: z2.number().int().positive(),
    costs: z2.array(z2.object({ resource: z2.string().trim().min(1).max(64), amount: z2.number().int().min(0), details: z2.string().trim().min(1) })).optional(),
    damageProfiles: z2.array(z2.object({ dice: z2.string().trim().min(1).max(32), modifier: z2.number().int().optional(), damageType: z2.string().trim().min(1).max(64), scaling: z2.string().max(255).optional(), details: z2.string().trim().min(1) })).optional(),
    ranges: z2.array(z2.object({ range: z2.number().int().min(0), unit: z2.string().trim().min(1).max(32), area: z2.string().max(255).optional(), target: z2.string().max(255).optional() })).optional(),
    conditions: z2.array(z2.object({ name: z2.string().trim().min(1).max(120), effect: z2.string().trim().min(1), duration: z2.string().max(120).optional() })).optional(),
    vowExchanges: z2.array(z2.object({ kind: z2.enum(["gain", "loss"]), description: z2.string().trim().min(1), valueNumber: z2.number().int().nullable().optional() })).optional(),
    evolutions: z2.array(z2.object({ name: z2.string().trim().min(1).max(160), description: z2.string().trim().min(1), isManual: z2.boolean().optional(), ruleSource: z2.enum(["official", "homebrew", "manual"]).optional() })).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.elementId);
    const { homebrewId: _homebrewId, elementId, ...mechanics } = input;
    return replaceStructuredExtendedMechanics(elementId, mechanics);
  }),
  structuredSaveMechanics: protectedProcedure.input(z2.object({
    homebrewId: z2.number().int().positive(),
    elementId: z2.number().int().positive(),
    requirements: z2.array(z2.object({ type: z2.enum(["atributo", "nivel", "origem", "voto", "aptidao", "especializacao", "tecnica", "item", "condicao", "custom"]), operator: z2.string().max(16).optional(), valueText: z2.string().max(255).nullable().optional(), valueNumber: z2.number().int().nullable().optional() })).optional(),
    attributeBonuses: z2.array(z2.object({ attribute: z2.string().trim().min(1).max(64), value: z2.number().int() })).optional(),
    effects: z2.array(z2.object({ effectType: z2.enum(["text", "bonus", "penalty", "condition", "custom"]).optional(), description: z2.string().trim().min(1), valueNumber: z2.number().int().nullable().optional() })).optional()
  })).mutation(async ({ ctx, input }) => {
    await assertOwner(input.homebrewId, ctx.user.id);
    await assertStructuredElementForHomebrew(input.homebrewId, input.elementId);
    const { homebrewId: _homebrewId, elementId, ...mechanics } = input;
    return replaceStructuredMechanics(elementId, mechanics);
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
      if (await getUserByEmail(input.email)) {
        throw new TRPCError3({ code: "CONFLICT", message: "Este e-mail j\xE1 est\xE1 cadastrado. Entre com sua senha ou use a recupera\xE7\xE3o de senha." });
      }
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
      if (!user) throw new TRPCError3({ code: "UNAUTHORIZED", message: "E-mail ou senha inv\xE1lidos." });
      if (!user.passwordHash) {
        if (user.loginMethod === "google") {
          throw new TRPCError3({ code: "UNAUTHORIZED", message: "Esta conta foi criada via Google. Use 'Esqueci minha senha' para definir uma senha local." });
        }
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "E-mail ou senha inv\xE1lidos." });
      }
      if (!await verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "E-mail ou senha inv\xE1lidos." });
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
function findDriverError(error, depth = 0) {
  if (!error || typeof error !== "object" || depth > 3) return void 0;
  const record = error;
  if (typeof record.errno === "number" || typeof record.sqlState === "string" || typeof record.sqlMessage === "string") {
    return record;
  }
  return findDriverError(record.cause, depth + 1);
}
function sanitizeDriverMessage(value) {
  if (typeof value !== "string") return void 0;
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]").replace(/\b(?:mysql|postgres(?:ql)?):\/\/[^\s]+/gi, "[connection-url-redacted]").replace(/Access denied for user '[^']+'@'[^']+'/gi, "Access denied for database user [redacted]").replace(/(?:\b(?:query|sql)\s*[:=]\s*|(?:^|[.;]\s*)\b(?:select|insert|update|delete|with|alter|create|drop)\b)[\s\S]*/i, "[sql-redacted]").slice(0, 500);
}
function getDatabaseErrorSummary(error) {
  const driverError = findDriverError(error);
  if (!driverError) return void 0;
  return {
    driverCode: typeof driverError.code === "string" ? driverError.code : void 0,
    driverErrno: typeof driverError.errno === "number" ? driverError.errno : void 0,
    driverSqlState: typeof driverError.sqlState === "string" ? driverError.sqlState : void 0,
    driverMessage: sanitizeDriverMessage(driverError.sqlMessage ?? driverError.message)
  };
}
function createApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(express.json({ limit: "2mb" }));
  app2.use(express.urlencoded({ limit: "2mb", extended: true }));
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type }) {
        const databaseError = getDatabaseErrorSummary(error);
        if (databaseError) {
          console.error("[Database Query Error]", JSON.stringify({ path, type, ...databaseError }));
        }
      }
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
