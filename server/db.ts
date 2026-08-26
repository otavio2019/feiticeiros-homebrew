import { and, desc, eq, like, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  homebrewElements,
  homebrewImages,
  homebrewModules,
  Homebrew,
  homebrews,
  InsertUser,
  users,
} from "../drizzle/schema";
import type { HomebrewModuleType } from "../shared/homebrewRules";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  updateSet.lastSignedIn = values.lastSignedIn;
  await database.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listHomebrewsForUser(ownerId: number, search?: string) {
  const database = await getDb();
  if (!database) return [];
  const filters = [eq(homebrews.ownerId, ownerId)];
  if (search) filters.push(or(like(homebrews.title, `%${search}%`), like(homebrews.summary, `%${search}%`))!);
  return database.select().from(homebrews).where(and(...filters)).orderBy(desc(homebrews.updatedAt));
}

export async function getHomebrewById(id: number) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(homebrews).where(eq(homebrews.id, id)).limit(1);
  return result[0];
}

export async function getShareableHomebrew(shareId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(homebrews).where(and(eq(homebrews.shareId, shareId), ne(homebrews.visibility, "private"))).limit(1);
  return result[0];
}

export async function getHomebrewDetail(id: number) {
  const database = await getDb();
  if (!database) return undefined;
  const homebrew = await getHomebrewById(id);
  if (!homebrew) return undefined;
  const [modules, elements, images] = await Promise.all([
    database.select().from(homebrewModules).where(eq(homebrewModules.homebrewId, id)).orderBy(homebrewModules.position),
    database.select().from(homebrewElements).where(eq(homebrewElements.homebrewId, id)).orderBy(homebrewElements.position),
    database.select().from(homebrewImages).where(eq(homebrewImages.homebrewId, id)),
  ]);
  return { ...homebrew, modules, elements, images };
}

export async function createHomebrew(input: {
  ownerId: number;
  shareId: string;
  title: string;
  summary: string;
  visibility: "private" | "unlisted" | "public";
  manualMode: boolean;
  modules: HomebrewModuleType[];
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const result = await database.insert(homebrews).values({
    ownerId: input.ownerId,
    shareId: input.shareId,
    title: input.title,
    summary: input.summary,
    visibility: input.visibility,
    manualMode: input.manualMode,
    data: { attributes: {}, notes: "" },
  });
  const id = Number((result as unknown as [{ insertId: number }])[0].insertId);
  await database.insert(homebrewModules).values(input.modules.map((type, position) => ({ homebrewId: id, type, position, data: {} })));
  return getHomebrewDetail(id);
}

export async function updateHomebrew(id: number, changes: {
  title?: string;
  summary?: string;
  visibility?: "private" | "unlisted" | "public";
  manualMode?: boolean;
  coverImageUrl?: string | null;
  characterLevel?: number;
  data?: Record<string, unknown>;
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.update(homebrews).set(changes).where(eq(homebrews.id, id));
  return getHomebrewDetail(id);
}

export async function deleteHomebrew(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.delete(homebrewImages).where(eq(homebrewImages.homebrewId, id));
  await database.delete(homebrewElements).where(eq(homebrewElements.homebrewId, id));
  await database.delete(homebrewModules).where(eq(homebrewModules.homebrewId, id));
  await database.delete(homebrews).where(eq(homebrews.id, id));
}

export async function duplicateHomebrew(source: Homebrew, ownerId: number, shareId: string) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const detail = await getHomebrewDetail(source.id);
  if (!detail) throw new Error("Homebrew original não encontrada.");

  const clonedHomebrew = await database.insert(homebrews).values({
    ownerId,
    shareId,
    title: `${source.title} — cópia`,
    summary: source.summary,
    visibility: "private",
    manualMode: source.manualMode,
    characterLevel: source.characterLevel,
    coverImageUrl: source.coverImageUrl,
    data: source.data,
  });
  const clonedHomebrewId = Number((clonedHomebrew as unknown as [{ insertId: number }])[0].insertId);
  const moduleMap = new Map<number, number>();

  for (const module of detail.modules) {
    const result = await database.insert(homebrewModules).values({
      homebrewId: clonedHomebrewId,
      type: module.type,
      position: module.position,
      enabled: module.enabled,
      data: module.data,
    });
    moduleMap.set(module.id, Number((result as unknown as [{ insertId: number }])[0].insertId));
  }

  const elementMap = new Map<number, number>();
  for (const element of detail.elements) {
    const result = await database.insert(homebrewElements).values({
      homebrewId: clonedHomebrewId,
      moduleId: moduleMap.get(element.moduleId)!,
      type: element.type,
      name: element.name,
      position: element.position,
      isManual: element.isManual,
      data: element.data,
    });
    elementMap.set(element.id, Number((result as unknown as [{ insertId: number }])[0].insertId));
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
    await database.insert(homebrewImages).values(detail.images.map(image => ({
      homebrewId: clonedHomebrewId,
      moduleId: image.moduleId ? moduleMap.get(image.moduleId) : undefined,
      elementId: image.elementId ? elementMap.get(image.elementId) : undefined,
      source: image.source,
      url: image.url,
      storageKey: image.storageKey,
      altText: image.altText,
    })));
  }

  return getHomebrewDetail(clonedHomebrewId);
}

export async function addModule(homebrewId: number, type: HomebrewModuleType) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const current = await database.select().from(homebrewModules).where(eq(homebrewModules.homebrewId, homebrewId));
  const result = await database.insert(homebrewModules).values({ homebrewId, type, position: current.length, data: {} });
  return { id: Number((result as unknown as [{ insertId: number }])[0].insertId) };
}

export async function addHomebrewImage(input: {
  homebrewId: number;
  source: "url" | "upload";
  url: string;
  storageKey?: string;
  moduleId?: number;
  elementId?: number;
  altText?: string;
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const result = await database.insert(homebrewImages).values({
    homebrewId: input.homebrewId,
    source: input.source,
    url: input.url,
    storageKey: input.storageKey,
    moduleId: input.moduleId,
    elementId: input.elementId,
    altText: input.altText,
  });
  return { id: Number((result as unknown as [{ insertId: number }])[0].insertId), url: input.url };
}

export async function removeHomebrewImage(homebrewId: number, imageId: number) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.delete(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.id, imageId)));
  return { success: true } as const;
}
