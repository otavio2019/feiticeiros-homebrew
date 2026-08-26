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
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const authSessions = mysqlTable(
  "authSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("auth_sessions_user_expires_idx").on(table.userId, table.expiresAt)],
);

export const passwordResetTokens = mysqlTable(
  "passwordResetTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("password_reset_token_hash_unique").on(table.tokenHash)],
);

export const authIdentities = mysqlTable(
  "authIdentities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerSubject: varchar("providerSubject", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("auth_identity_provider_subject_unique").on(table.provider, table.providerSubject)],
);

export const homebrewVisibility = mysqlEnum("homebrewVisibility", ["private", "unlisted", "public"]);
export const homebrewStatus = mysqlEnum("homebrewStatus", ["draft", "published"]);
export const homebrewModuleType = mysqlEnum("homebrewModuleType", [
  "origem",
  "votos",
  "tecnicas",
  "armas",
  "shikigami",
  "mecanicas",
  "aptidoes",
  "especializacoes",
  "outros",
]);
export const homebrewElementType = mysqlEnum("homebrewElementType", [
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
]);
export const imageSource = mysqlEnum("imageSource", ["url", "upload"]);

export const homebrews = mysqlTable(
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
    data: json("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("homebrews_share_id_unique").on(table.shareId),
    index("homebrews_owner_updated_idx").on(table.ownerId, table.updatedAt),
  ],
);

export const homebrewModules = mysqlTable(
  "homebrewModules",
  {
    id: int("id").autoincrement().primaryKey(),
    homebrewId: int("homebrewId").notNull().references(() => homebrews.id),
    type: homebrewModuleType.notNull(),
    position: int("position").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    data: json("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("homebrew_modules_homebrew_position_idx").on(table.homebrewId, table.position)],
);

export const homebrewElements = mysqlTable(
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
    data: json("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("homebrew_elements_module_position_idx").on(table.moduleId, table.position),
    index("homebrew_elements_homebrew_type_idx").on(table.homebrewId, table.type),
  ],
);

export const homebrewImages = mysqlTable(
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("homebrew_images_homebrew_idx").on(table.homebrewId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Homebrew = typeof homebrews.$inferSelect;
export type InsertHomebrew = typeof homebrews.$inferInsert;
