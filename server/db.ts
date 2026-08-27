import { and, desc, eq, gt, isNull, like, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import {
  authSessions,
  homebrewElements,
  homebrewImages,
  homebrewModules,
  Homebrew,
  homebrews,
  InsertUser,
  passwordResetTokens,
  users,
  homebrewStructuredElements,
  structuredAttributeBonuses,
  structuredRequirements,
  structuredEffects,
  structuredCosts,
  structuredDamageProfiles,
  structuredRanges,
  structuredConditions,
  structuredVowExchanges,
  structuredEvolutions,
  structuredWeaponTechniqueLinks,
} from "../drizzle/schema";
import { validateStructuredExtendedMechanics, validateStructuredMechanics, type HomebrewModuleType } from "../shared/homebrewRules";
import { ENV } from "./_core/env";
import { getDatabaseUrl, getMySqlPoolOptions } from "./database";

let _pool: Pool | null = null;
type Database = ReturnType<typeof drizzle<Record<string, never>, Pool>>;
let _db: Database | null = null;

export async function getDb() {
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

export async function getUserById(id: number) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { email: string; name: string | null; passwordHash: string }) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const openId = `local_${crypto.randomUUID()}`;
  await database.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    normalizedEmail: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    loginMethod: "password",
  });
  return getUserByOpenId(openId);
}

export async function createAuthSession(userId: number, tokenHash: string, expiresAt: Date) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.insert(authSessions).values({ userId, tokenHash, expiresAt });
}

export async function getUserBySessionTokenHash(tokenHash: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database
    .select({ user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return result[0]?.user;
}

export async function deleteAuthSession(tokenHash: string) {
  const database = await getDb();
  if (!database) return;
  await database.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}

export async function createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await database.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
}

export async function consumePasswordResetToken(tokenHash: string) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");

  return database.transaction(async tx => {
    const result = await tx
      .select({ id: passwordResetTokens.id, user: users })
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, new Date()), isNull(passwordResetTokens.usedAt)))
      .limit(1);
    const reset = result[0];
    if (!reset) return undefined;
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, reset.id));
    return reset.user;
  });
}

export async function updateUserPasswordAndInvalidateSessions(userId: number, passwordHash: string) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.transaction(async tx => {
    await tx.update(users).set({ passwordHash, loginMethod: "password", lastSignedIn: new Date() }).where(eq(users.id, userId));
    await tx.delete(authSessions).where(eq(authSessions.userId, userId));
  });
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

async function duplicateStructuredEntities(database: Database, sourceHomebrewId: number, clonedHomebrewId: number, moduleMap: Map<number, number>, legacyElementMap: Map<number, number>) {
  const sourceElements = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, sourceHomebrewId));
  const structuredElementMap = new Map<number, number>();
  for (const element of sourceElements) {
    const clonedModuleId = moduleMap.get(element.moduleId);
    if (!clonedModuleId) continue;
    const result = await database.insert(homebrewStructuredElements).values({
      homebrewId: clonedHomebrewId,
      moduleId: clonedModuleId,
      legacyElementId: element.legacyElementId ? (legacyElementMap.get(element.legacyElementId) ?? null) : null,
      type: element.type,
      name: element.name,
      description: element.description,
      position: element.position,
      isManual: element.isManual,
      ruleSource: element.ruleSource,
    });
    structuredElementMap.set(element.id, Number((result as unknown as [{ insertId: number }])[0].insertId));
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
      database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, element.id)),
    ]);
    if (attributeBonuses.length) await database.insert(structuredAttributeBonuses).values(attributeBonuses.map(item => ({ elementId: clonedElementId, attribute: item.attribute, value: item.value, position: item.position })));
    if (requirements.length) await database.insert(structuredRequirements).values(requirements.map(item => ({ elementId: clonedElementId, type: item.type, operator: item.operator, valueText: item.valueText, valueNumber: item.valueNumber, position: item.position })));
    if (effects.length) await database.insert(structuredEffects).values(effects.map(item => ({ elementId: clonedElementId, effectType: item.effectType, description: item.description, valueNumber: item.valueNumber, position: item.position })));
    if (costs.length) await database.insert(structuredCosts).values(costs.map(item => ({ elementId: clonedElementId, resource: item.resource, amount: item.amount, details: item.details, position: item.position })));
    if (damageProfiles.length) await database.insert(structuredDamageProfiles).values(damageProfiles.map(item => ({ elementId: clonedElementId, dice: item.dice, modifier: item.modifier, damageType: item.damageType, scaling: item.scaling, details: item.details })));
    if (ranges.length) await database.insert(structuredRanges).values(ranges.map(item => ({ elementId: clonedElementId, range: item.range, unit: item.unit, area: item.area, target: item.target })));
    if (conditions.length) await database.insert(structuredConditions).values(conditions.map(item => ({ elementId: clonedElementId, name: item.name, effect: item.effect, duration: item.duration, position: item.position })));
    if (vowExchanges.length) await database.insert(structuredVowExchanges).values(vowExchanges.map(item => ({ elementId: clonedElementId, kind: item.kind, description: item.description, valueNumber: item.valueNumber, position: item.position })));
    if (evolutions.length) await database.insert(structuredEvolutions).values(evolutions.map(item => ({ elementId: clonedElementId, name: item.name, description: item.description, position: item.position, isManual: item.isManual, ruleSource: item.ruleSource })));
  }
  const links = await database.select().from(structuredWeaponTechniqueLinks).where(eq(structuredWeaponTechniqueLinks.homebrewId, sourceHomebrewId));
  for (const link of links) {
    const weaponElementId = structuredElementMap.get(link.weaponElementId);
    const techniqueElementId = structuredElementMap.get(link.techniqueElementId);
    if (weaponElementId && techniqueElementId) await database.insert(structuredWeaponTechniqueLinks).values({ homebrewId: clonedHomebrewId, weaponElementId, techniqueElementId });
  }
  return structuredElementMap;
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

  const structuredElementMap = await duplicateStructuredEntities(database, source.id, clonedHomebrewId, moduleMap, elementMap);
  if (detail.images.length) {
    await database.insert(homebrewImages).values(detail.images.map(image => ({
      homebrewId: clonedHomebrewId,
      moduleId: image.moduleId ? moduleMap.get(image.moduleId) : undefined,
      elementId: image.elementId ? (structuredElementMap.get(image.elementId) ?? elementMap.get(image.elementId)) : undefined,
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


export async function listStructuredElements(homebrewId: number, moduleId?: number) {
  const database = await getDb();
  if (!database) return [];
  const elements = await database.select().from(homebrewStructuredElements)
    .where(moduleId ? and(eq(homebrewStructuredElements.homebrewId, homebrewId), eq(homebrewStructuredElements.moduleId, moduleId)) : eq(homebrewStructuredElements.homebrewId, homebrewId))
    .orderBy(homebrewStructuredElements.position);
  return Promise.all(elements.map(async element => ({
    ...element,
    images: await database.select().from(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.elementId, element.id))),
  })));
}

export async function createStructuredElement(input: {
  homebrewId: number;
  moduleId: number;
  type: "origem" | "shikigami" | "voto" | "tecnica" | "feitico" | "arma" | "mecanica" | "aptidao" | "especializacao" | "outro";
  name: string;
  description: string;
  isManual?: boolean;
  position?: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const result = await database.insert(homebrewStructuredElements).values({
    homebrewId: input.homebrewId,
    moduleId: input.moduleId,
    type: input.type,
    name: input.name,
    description: input.description,
    isManual: input.isManual ?? false,
    position: input.position ?? 0,
  });
  const id = Number((result as unknown as [{ insertId: number }])[0].insertId);
  const rows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id));
  return rows[0];
}

export async function updateStructuredElement(id: number, input: Partial<{
  moduleId: number;
  type: "origem" | "shikigami" | "voto" | "tecnica" | "feitico" | "arma" | "mecanica" | "aptidao" | "especializacao" | "outro";
  name: string;
  description: string;
  isManual: boolean;
  position: number;
}>) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.update(homebrewStructuredElements).set(input).where(eq(homebrewStructuredElements.id, id));
  const rows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id));
  return rows[0];
}

export async function deleteStructuredElement(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const elementRows = await database.select({ homebrewId: homebrewStructuredElements.homebrewId }).from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1);
  const element = elementRows[0];
  await database.transaction(async tx => {
    await tx.delete(homebrewImages).where(eq(homebrewImages.elementId, id));
    await tx.delete(structuredRequirements).where(eq(structuredRequirements.elementId, id));
    await tx.delete(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, id));
    await tx.delete(structuredEffects).where(eq(structuredEffects.elementId, id));
    await tx.delete(structuredCosts).where(eq(structuredCosts.elementId, id));
    await tx.delete(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, id));
    await tx.delete(structuredRanges).where(eq(structuredRanges.elementId, id));
    await tx.delete(structuredConditions).where(eq(structuredConditions.elementId, id));
    await tx.delete(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, id));
    await tx.delete(structuredEvolutions).where(eq(structuredEvolutions.elementId, id));
    await tx.delete(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id));
  });
  return { id, homebrewId: element?.homebrewId };
}

export async function replaceStructuredMechanics(elementId: number, input: {
  requirements?: Array<{ type: "atributo" | "nivel" | "origem" | "voto" | "aptidao" | "especializacao" | "tecnica" | "item" | "condicao" | "custom"; operator?: string; valueText?: string | null; valueNumber?: number | null }>;
  attributeBonuses?: Array<{ attribute: string; value: number }>;
  effects?: Array<{ effectType?: "text" | "bonus" | "penalty" | "condition" | "custom"; description: string; valueNumber?: number | null }>;
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const validation = validateStructuredMechanics(input);
  if (!validation.valid) throw new Error(`Dados mecânicos inválidos: ${validation.errors.join(" ")}`);
  await database.transaction(async tx => {
    await tx.delete(structuredRequirements).where(eq(structuredRequirements.elementId, elementId));
    await tx.delete(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, elementId));
    await tx.delete(structuredEffects).where(eq(structuredEffects.elementId, elementId));
    if (input.requirements?.length) await tx.insert(structuredRequirements).values(input.requirements.map((item, position) => ({ elementId, type: item.type, operator: item.operator ?? "gte", valueText: item.valueText ?? null, valueNumber: item.valueNumber ?? null, position })));
    if (input.attributeBonuses?.length) await tx.insert(structuredAttributeBonuses).values(input.attributeBonuses.map((item, position) => ({ elementId, attribute: item.attribute, value: item.value, position })));
    if (input.effects?.length) await tx.insert(structuredEffects).values(input.effects.map((item, position) => ({ elementId, effectType: item.effectType ?? "text", description: item.description, valueNumber: item.valueNumber ?? null, position })));
  });
  return { elementId };
}

export async function getStructuredMechanics(elementId: number) {
  const database = await getDb();
  if (!database) return { requirements: [], attributeBonuses: [], effects: [] };
  const [requirements, attributeBonuses, effects, costs, damageProfiles, ranges, conditions, evolutions] = await Promise.all([
    database.select().from(structuredRequirements).where(eq(structuredRequirements.elementId, elementId)).orderBy(structuredRequirements.position),
    database.select().from(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, elementId)),
    database.select().from(structuredEffects).where(eq(structuredEffects.elementId, elementId)).orderBy(structuredEffects.position),
    database.select().from(structuredCosts).where(eq(structuredCosts.elementId, elementId)).orderBy(structuredCosts.position),
    database.select().from(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, elementId)),
    database.select().from(structuredRanges).where(eq(structuredRanges.elementId, elementId)),
    database.select().from(structuredConditions).where(eq(structuredConditions.elementId, elementId)).orderBy(structuredConditions.position),
    database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, elementId)).orderBy(structuredEvolutions.position),
  ]);
  return { requirements, attributeBonuses, effects, costs, damageProfiles, ranges, conditions, evolutions };
}

export async function createWeaponTechniqueLink(input: { homebrewId: number; weaponElementId: number; techniqueElementId: number }) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.insert(structuredWeaponTechniqueLinks).values(input);
  return input;
}
export async function listWeaponTechniqueLinks(homebrewId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(structuredWeaponTechniqueLinks).where(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId));
}
export async function deleteWeaponTechniqueLink(homebrewId: number, id: number) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  await database.delete(structuredWeaponTechniqueLinks).where(and(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId), eq(structuredWeaponTechniqueLinks.id, id)));
  return { id };
}
export async function updateWeaponTechniqueLink(input: { homebrewId: number; id: number; weaponElementId: number; techniqueElementId: number }) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const { id, homebrewId, ...changes } = input;
  await database.update(structuredWeaponTechniqueLinks).set(changes).where(and(eq(structuredWeaponTechniqueLinks.homebrewId, homebrewId), eq(structuredWeaponTechniqueLinks.id, id)));
  return input;
}


export async function listStructuredElementsForShare(homebrewId: number) {
  const database = await getDb();
  if (!database) return [];
  const elements = await database.select().from(homebrewStructuredElements)
    .where(eq(homebrewStructuredElements.homebrewId, homebrewId))
    .orderBy(homebrewStructuredElements.position);
  return Promise.all(elements.map(async element => {
    const [attributeBonuses, requirements, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions, images] = await Promise.all([
      database.select().from(structuredAttributeBonuses).where(eq(structuredAttributeBonuses.elementId, element.id)),
      database.select().from(structuredRequirements).where(eq(structuredRequirements.elementId, element.id)).orderBy(structuredRequirements.position),
      database.select().from(structuredEffects).where(eq(structuredEffects.elementId, element.id)).orderBy(structuredEffects.position),
      database.select().from(structuredCosts).where(eq(structuredCosts.elementId, element.id)).orderBy(structuredCosts.position),
      database.select().from(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, element.id)),
      database.select().from(structuredRanges).where(eq(structuredRanges.elementId, element.id)),
      database.select().from(structuredConditions).where(eq(structuredConditions.elementId, element.id)).orderBy(structuredConditions.position),
      database.select().from(structuredVowExchanges).where(eq(structuredVowExchanges.elementId, element.id)).orderBy(structuredVowExchanges.position),
      database.select().from(structuredEvolutions).where(eq(structuredEvolutions.elementId, element.id)).orderBy(structuredEvolutions.position),
      database.select().from(homebrewImages).where(and(eq(homebrewImages.homebrewId, homebrewId), eq(homebrewImages.elementId, element.id))),
    ]);
    return { ...element, images, mechanics: { attributeBonuses, requirements, effects, costs, damageProfiles, ranges, conditions, vowExchanges, evolutions } };
  }));
}


export async function reorderStructuredElement(id: number, direction: "up" | "down") {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const currentRows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1);
  const current = currentRows[0];
  if (!current) return undefined;
  const rows = await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.homebrewId, current.homebrewId)).orderBy(homebrewStructuredElements.position);
  const index = rows.findIndex(row => row.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || !rows[targetIndex]) return current;
  const target = rows[targetIndex];
  await database.transaction(async tx => {
    await tx.update(homebrewStructuredElements).set({ position: target.position }).where(eq(homebrewStructuredElements.id, current.id));
    await tx.update(homebrewStructuredElements).set({ position: current.position }).where(eq(homebrewStructuredElements.id, target.id));
  });
  return (await database.select().from(homebrewStructuredElements).where(eq(homebrewStructuredElements.id, id)).limit(1))[0];
}


export async function replaceStructuredExtendedMechanics(elementId: number, input: {
  costs?: Array<{ resource: string; amount: number; details: string }>;
  damageProfiles?: Array<{ dice: string; modifier?: number; damageType: string; scaling?: string; details: string }>;
  ranges?: Array<{ range: number; unit: string; area?: string; target?: string }>;
  conditions?: Array<{ name: string; effect: string; duration?: string }>;
  evolutions?: Array<{ name: string; description: string; isManual?: boolean; ruleSource?: "official" | "homebrew" | "manual" }>;
}) {
  const database = await getDb();
  if (!database) throw new Error("Banco de dados indisponível.");
  const validation = validateStructuredExtendedMechanics(input);
  if (!validation.valid) throw new Error(`Dados mecânicos estendidos inválidos: ${validation.errors.join(" ")}`);
  await database.transaction(async tx => {
    await tx.delete(structuredCosts).where(eq(structuredCosts.elementId, elementId));
    await tx.delete(structuredDamageProfiles).where(eq(structuredDamageProfiles.elementId, elementId));
    await tx.delete(structuredRanges).where(eq(structuredRanges.elementId, elementId));
    await tx.delete(structuredConditions).where(eq(structuredConditions.elementId, elementId));
    await tx.delete(structuredEvolutions).where(eq(structuredEvolutions.elementId, elementId));
    if (input.costs?.length) await tx.insert(structuredCosts).values(input.costs.map((item, position) => ({ elementId, resource: item.resource, amount: item.amount, details: item.details, position })));
    if (input.damageProfiles?.length) await tx.insert(structuredDamageProfiles).values(input.damageProfiles.map(item => ({ elementId, dice: item.dice, modifier: item.modifier ?? 0, damageType: item.damageType, scaling: item.scaling ?? "", details: item.details })));
    if (input.ranges?.length) await tx.insert(structuredRanges).values(input.ranges.map(item => ({ elementId, range: item.range, unit: item.unit, area: item.area ?? "", target: item.target ?? "" })));
    if (input.conditions?.length) await tx.insert(structuredConditions).values(input.conditions.map((item, position) => ({ elementId, name: item.name, effect: item.effect, duration: item.duration ?? "", position })));
    if (input.evolutions?.length) await tx.insert(structuredEvolutions).values(input.evolutions.map((item, position) => ({ elementId, name: item.name, description: item.description, position, isManual: item.isManual ?? false, ruleSource: item.ruleSource ?? "homebrew" })));
  });
  return { elementId };
}
