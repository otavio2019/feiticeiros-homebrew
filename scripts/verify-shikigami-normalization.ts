import { eq } from "drizzle-orm";
import {
  shikigamiAbilities,
  shikigamiAttributes,
  shikigamiOptions,
  shikigamiSheets,
  shikigamiSkills,
  users,
} from "../drizzle/schema";
import {
  createHomebrew,
  deleteHomebrew,
  duplicateHomebrew,
  getDb,
  getHomebrewById,
  getHomebrewDetail,
  updateHomebrew,
} from "../server/db";

if (!process.env.TIDB_DATABASE_URL) {
  throw new Error("TIDB_DATABASE_URL é obrigatório para verificar a normalização de Shikigami.");
}

const database = await getDb();
if (!database) throw new Error("Não foi possível inicializar a conexão TiDB.");

let sourceId: number | undefined;
let cloneId: number | undefined;
try {
  const [owner] = await database.select({ id: users.id }).from(users).limit(1);
  if (!owner) throw new Error("Não existe usuário disponível para o teste reversível.");

  const created = await createHomebrew({
    ownerId: owner.id,
    shareId: `shiki-check-${crypto.randomUUID().slice(0, 10)}`,
    title: "Verificação temporária de Shikigami",
    summary: "Registro temporário removido pelo smoke test.",
    visibility: "private",
    manualMode: false,
    modules: ["shikigami"],
  });
  if (!created) throw new Error("A Homebrew temporária não foi criada.");
  sourceId = created.id;

  await updateHomebrew(sourceId, {
    data: {
      shikigami: {
        name: "Corvo de Verificação",
        type: "tecnica",
        grade: "segundo",
        userLevel: 7,
        mastery: 3,
        attributes: { forca: 12, destreza: 11, constituicao: 10, inteligencia: 14, sabedoria: 10, carisma: 10 },
        skills: { feiticaria: { otherBonus: 2, mastery: true }, reflexos: { specialty: true } },
        lostHealth: 4,
        healedHealth: 1,
        notes: "Registro temporário para validar a persistência relacional.",
        controllerOptions: { concentrarPoder: true, invocacoesResistentes: true },
        traits: { defesaAlternativa: true, bonusPericiaA: true, bonusPericiaC: true, perito: true },
        movementAttribute: "destreza",
        defenseAttribute: "inteligencia",
        bonusSkillA: "feiticaria",
        bonusSkillB: "reflexos",
        bonusSkillC: "ocultismo",
        size: "grande",
        abilities: [
          { id: "acao-verificacao", kind: "acao", name: "Investida", description: "Ação temporária." },
          { id: "caracteristica-verificacao", kind: "caracteristica", name: "Olhos rúnicos", description: "Característica temporária." },
        ],
      },
    },
  });

  const source = await getHomebrewById(sourceId);
  const hydrated = await getHomebrewDetail(sourceId);
  if (!source || !hydrated) throw new Error("A ficha temporária não pôde ser relida.");
  const sheet = hydrated.data.shikigami as Record<string, unknown> | undefined;
  if (!sheet || sheet.type !== "tecnica" || sheet.grade !== "segundo" || sheet.name !== "Corvo de Verificação") {
    throw new Error("A ficha relacional não foi hidratada com os valores gravados.");
  }

  const [normalizedSheet] = await database.select().from(shikigamiSheets).where(eq(shikigamiSheets.homebrewId, sourceId));
  if (!normalizedSheet) throw new Error("A ficha normalizada não foi criada.");
  const [attributes, skills, options, abilities] = await Promise.all([
    database.select().from(shikigamiAttributes).where(eq(shikigamiAttributes.sheetId, normalizedSheet.id)),
    database.select().from(shikigamiSkills).where(eq(shikigamiSkills.sheetId, normalizedSheet.id)),
    database.select().from(shikigamiOptions).where(eq(shikigamiOptions.sheetId, normalizedSheet.id)),
    database.select().from(shikigamiAbilities).where(eq(shikigamiAbilities.sheetId, normalizedSheet.id)),
  ]);
  if (attributes.length !== 6 || skills.length !== 16 || options.length !== 18 || abilities.length !== 2) {
    throw new Error("As coleções normalizadas de Shikigami não possuem as quantidades esperadas.");
  }

  const cloned = await duplicateHomebrew(source, owner.id, `shiki-clone-${crypto.randomUUID().slice(0, 10)}`);
  cloneId = cloned?.id;
  const clonedDetail = cloneId ? await getHomebrewDetail(cloneId) : undefined;
  const clonedSheet = clonedDetail?.data.shikigami as Record<string, unknown> | undefined;
  if (!clonedSheet || clonedSheet.name !== "Corvo de Verificação" || !Array.isArray(clonedSheet.abilities) || clonedSheet.abilities.length !== 2) {
    throw new Error("A duplicação não preservou a ficha relacional de Shikigami.");
  }

  console.info("Normalização, hidratação e duplicação de Shikigami verificadas no TiDB.");
} finally {
  if (cloneId) await deleteHomebrew(cloneId);
  if (sourceId) await deleteHomebrew(sourceId);
  await database.$client.end();
}

process.exit(0);
