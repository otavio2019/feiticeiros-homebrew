import { describe, expect, it } from "vitest";
import {
  calculateAttributeModifier,
  buildHomebrewValidation,
  calculateInvocationStats,
  calculateTechniqueDifficulty,
  isVowCombinationAllowed,
  SPELL_COST_BY_LEVEL,
} from "../shared/homebrewRules";

describe("regras estruturadas de Homebrew", () => {
  it("calcula modificadores e CD da técnica", () => {
    expect(calculateAttributeModifier(8)).toBe(-1);
    expect(calculateAttributeModifier(17)).toBe(3);
    expect(calculateTechniqueDifficulty(8, 18, 3)).toBe(21);
  });

  it("preserva custos oficiais por nível de feitiço", () => {
    expect(SPELL_COST_BY_LEVEL[0]).toBe(0);
    expect(SPELL_COST_BY_LEVEL[3]).toBe(8);
    expect(SPELL_COST_BY_LEVEL[5]).toBe(20);
  });

  it("rejeita combinações incompatíveis de duração e peso para voto próprio", () => {
    expect(isVowCombinationAllowed("temporario", "extremo")).toBe(false);
    expect(isVowCombinationAllowed("permanente", "leve")).toBe(false);
    expect(isVowCombinationAllowed("permanente", "pesado")).toBe(true);
  });

  it("calcula dados principais da ficha de invocação", () => {
    expect(calculateInvocationStats("quarto", 12, 14, 4, 2)).toMatchObject({
      cost: 2,
      attributePoints: 10,
      attributeCap: 16,
      health: 20,
      defense: 14,
    });
  });

  it("gera pendências contextuais para os campos essenciais do construtor", () => {
    const pending = buildHomebrewValidation("A", "", "tecnicas", true, {});
    expect(pending.filter(item => !item.valid)).toHaveLength(6);

    const complete = buildHomebrewValidation("Técnica da Aurora", "Resumo da técnica", "tecnicas", true, {
      tecnicasNarrative: "Uma descrição suficientemente detalhada da técnica.",
      manualNotes: "Esta campanha usa uma exceção narrativa registrada pelo autor.",
      techniqueType: "dano",
      techniqueLevel: 1,
      techniqueCost: 2,
    });
    expect(complete.every(item => item.valid)).toBe(true);
  });

  it("valida campos específicos de técnica e voto", () => {
    const technique = buildHomebrewValidation("Técnica", "Resumo", "tecnicas", false, {
      tecnicasNarrative: "Descrição suficiente do funcionamento da técnica.",
      techniqueType: "dano",
      techniqueLevel: 2,
      techniqueCost: 8,
    });
    expect(technique.find(item => item.key === "technique-cost")?.valid).toBe(false);

    const vow = buildHomebrewValidation("Voto", "Resumo", "votos", false, {
      votosNarrative: "Descrição suficiente da intenção do voto.",
      vowDuration: "temporario",
      vowWeight: "extremo",
      vowTrade: "Recebo uma vantagem em troca de uma limitação detalhada.",
    });
    expect(vow.find(item => item.key === "vow-weight")?.valid).toBe(false);
  });
});
