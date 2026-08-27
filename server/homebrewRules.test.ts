import { describe, expect, it } from "vitest";
import {
  calculateAttributeModifier,
  buildHomebrewValidation,
  calculateInvocationStats,
  validateInvocationSheet,
  getSpellCost,
  isTechniqueCostAllowed,
  calculateTechniqueDifficulty,
  isVowCombinationAllowed,
  SPELL_COST_BY_LEVEL,
  validateStructuredMechanics,
  validateStructuredExtendedMechanics,
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
    expect(getSpellCost(3)).toBe(8);
    expect(getSpellCost(6)).toBeNull();
    expect(isTechniqueCostAllowed(3, 8)).toBe(true);
    expect(isTechniqueCostAllowed(3, 2)).toBe(false);
    expect(isTechniqueCostAllowed(3, 2, true)).toBe(true);
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

  it("valida a distribuição estruturada de atributos do Shikigami", () => {
    const allowed = validateInvocationSheet("quarto", { forca: 4, destreza: 3, constituicao: 3 });
    expect(allowed.allocatedPoints).toBe(10);
    expect(allowed.withinPointBudget).toBe(true);
    expect(allowed.withinAttributeCap).toBe(true);

    const invalid = validateInvocationSheet("quarto", { forca: 17, destreza: 4 });
    expect(invalid.withinPointBudget).toBe(false);
    expect(invalid.withinAttributeCap).toBe(false);
    expect(validateInvocationSheet("quarto", { forca: 17, destreza: 4 }, true).withinPointBudget).toBe(true);
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

  it("valida mecânicas estruturadas sem presumir regras não documentadas", () => {
    expect(validateStructuredMechanics({ requirements: [{ type: "atributo", valueNumber: 3 }], attributeBonuses: [{ attribute: "forca", value: 2 }], effects: [{ description: "Aplica condição." }] }).valid).toBe(true);
    expect(validateStructuredMechanics({ requirements: [{ type: "", valueText: null }] }).valid).toBe(false);
    expect(validateStructuredMechanics({ requirements: [{ type: "", valueText: null }] }, true).valid).toBe(true);
  });

  it("valida coleções mecânicas estendidas sem presumir fórmulas do livro", () => {
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "PE", amount: 2, details: "Custo" }], damageProfiles: [{ dice: "2d6", damageType: "energia", details: "Dano" }], ranges: [{ range: 12, unit: "metros" }], conditions: [{ name: "Marcado", effect: "Efeito" }], evolutions: [{ name: "Avanço", description: "Descrição" }] }).valid).toBe(true);
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "", amount: -1, details: "" }], ranges: [{ range: -2, unit: "" }] }).valid).toBe(false);
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "", amount: -1, details: "" }] }, true).valid).toBe(true);
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

    const shikigami = buildHomebrewValidation("Shikigami", "Resumo", "shikigami", false, {
      shikigamiNarrative: "Invocação de suporte com atributos e habilidades estruturadas.",
      shikigami: { name: "Kuro", grade: "quarto", attributes: { forca: 5, destreza: 3, constituicao: 2 } },
    });
    expect(shikigami.every(item => item.valid)).toBe(true);
  });
});
