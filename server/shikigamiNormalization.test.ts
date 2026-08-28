import { describe, expect, it } from "vitest";
import { normalizeShikigamiDraft } from "./db";

describe("normalização relacional de Shikigami", () => {
  it("não cria ficha relacional quando o módulo não possui uma ficha estruturada", () => {
    expect(normalizeShikigamiDraft(undefined)).toBeUndefined();
    expect(normalizeShikigamiDraft([])).toBeUndefined();
  });

  it("aplica os defaults visíveis e materializa as coleções fechadas da planilha", () => {
    const normalized = normalizeShikigamiDraft({
      name: "Corvo ritual",
      type: "tecnica",
      grade: "segundo",
      userLevel: 7.8,
      mastery: -5,
      attributes: { forca: 9, inteligencia: 14 },
      skills: {
        feiticaria: { manualBonus: 3, trained: true },
        reflexos: { otherBonus: -2, specialty: true },
      },
      controllerOptions: { concentrarPoder: true, opcaoInexistente: true },
      traits: { bonusPericiaA: true, bonusPericiaC: true, tamanho: true },
      abilities: [
        { id: "ataque-1", kind: "acao", name: "Investida", description: "Ataca um alvo." },
        { id: "traco-1", kind: "invalido", name: "Penas", description: "Flutua." },
      ],
    });

    expect(normalized?.sheet).toMatchObject({
      name: "Corvo ritual",
      type: "tecnica",
      grade: "segundo",
      userLevel: 7,
      mastery: 0,
      movementAttribute: "destreza",
      defenseAttribute: "destreza",
      bonusSkillA: "feiticaria",
      bonusSkillB: "investigacao",
      size: "medio",
    });
    expect(Object.fromEntries(normalized!.attributes.map(item => [item.attribute, item.value]))).toEqual({
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 14,
      sabedoria: 10,
      carisma: 10,
    });
    expect(normalized?.skills).toHaveLength(16);
    expect(normalized?.skills.find(item => item.skill === "feiticaria")).toMatchObject({ otherBonus: 3, mastery: true, specialty: false });
    expect(normalized?.skills.find(item => item.skill === "reflexos")).toMatchObject({ otherBonus: -2, mastery: false, specialty: true });
    expect(normalized?.options).toHaveLength(18);
    expect(normalized?.options.filter(item => item.enabled).map(item => item.code)).toEqual(["concentrarPoder", "bonusPericiaA", "tamanho", "bonusPericiaC"]);
    expect(normalized?.abilities).toEqual([
      { clientId: "ataque-1", kind: "acao", name: "Investida", description: "Ataca um alvo.", position: 0 },
      { clientId: "traco-1", kind: "acao", name: "Penas", description: "Flutua.", position: 1 },
    ]);
  });

  it("preserva o mínimo de atributos para Comum e usa defaults seguros para valores fora das listas", () => {
    const normalized = normalizeShikigamiDraft({
      type: "fora-da-lista",
      grade: "invalido",
      attributes: { forca: 2 },
      movementAttribute: "sem-atributo",
      bonusSkillA: "sem-pericia",
      size: "gigante",
    });
    expect(normalized?.sheet).toMatchObject({ type: "comum", grade: "quarto", movementAttribute: "destreza", bonusSkillA: "feiticaria", size: "medio" });
    expect(normalized?.attributes.find(item => item.attribute === "forca")?.value).toBe(8);
  });

  it("mantém no máximo dez ações e dez características, como as vinte células da planilha", () => {
    const normalized = normalizeShikigamiDraft({
      abilities: [
        ...Array.from({ length: 12 }, (_, index) => ({ id: `acao-${index}`, kind: "acao", name: `Ação ${index}` })),
        ...Array.from({ length: 11 }, (_, index) => ({ id: `traco-${index}`, kind: "caracteristica", name: `Traço ${index}` })),
      ],
    });
    expect(normalized?.abilities).toHaveLength(20);
    expect(normalized?.abilities.filter(item => item.kind === "acao")).toHaveLength(10);
    expect(normalized?.abilities.filter(item => item.kind === "caracteristica")).toHaveLength(10);
  });
});
