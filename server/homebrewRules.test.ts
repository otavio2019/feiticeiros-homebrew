import { describe, expect, it } from "vitest";
import {
  calculateAttributeModifier,
  calculateShikigamiReferenceStats,
  buildHomebrewValidation,
  calculateInvocationStats,
  validateInvocationSheet,
  getSpellCost,
  isTechniqueCostAllowed,
  calculateTechniqueDifficulty,
  isVowCombinationAllowed,
  SPELL_COST_BY_LEVEL,
  STRUCTURED_DAMAGE_TYPES,
  validateStructuredMechanics,
  validateStructuredExtendedMechanics,
} from "../shared/homebrewRules";

describe("regras estruturadas de Homebrew", () => {
  it("mantém os quinze tipos de dano oficiais como opções estruturadas", () => {
    expect(STRUCTURED_DAMAGE_TYPES).toHaveLength(15);
    expect(STRUCTURED_DAMAGE_TYPES.map(item => item.value)).toEqual(["cortante", "perfurante", "impacto", "acido", "congelante", "chocante", "queimante", "sonico", "alma", "energia-reversa", "energetico", "psiquico", "radiante", "necrotico", "venenoso"]);
  });

  it("calcula apenas as progressões de Shikigami descritas no modelo de referência", () => {
    const calculated = calculateShikigamiReferenceStats({
      grade: "quarto",
      attributes: { constituicao: 8, destreza: 8 },
      userLevel: 10,
      mastery: 2,
      controllerOptions: { fantocheSupremo: true, invocacoesResistentes: true, melhoriaMobilidade: true, melhoriaPrecisao: true },
      traits: { robustez: true, movel: true, perito: true, defensor: true, bonusPericia: true },
    });
    expect(calculated.cost).toBe(12);
    expect(calculated.health).toBe(45);
    expect(calculated.defense).toBe(21);
    expect(calculated.movement).toBe(19.5);
    expect(calculated.difficulty).toBe(18);
    expect(calculated.precisionCdBonus).toBe(3);
    expect(calculated.skillSlots).toBe(4);
    expect(calculated.skillBonus).toBe(2);
    expect(calculated.defenderArmor).toBe(2);
  });

  it("aplica tipo, registros adicionais, tamanho e especialização como na planilha Google", () => {
    const calculated = calculateShikigamiReferenceStats({
      grade: "terceiro",
      type: "tecnica",
      attributes: { forca: 10, destreza: 12, constituicao: 10, inteligencia: 14, sabedoria: 10, carisma: 10 },
      userLevel: 8,
      mastery: 3,
      selectedSkills: 2,
      additionalEntryCount: 6,
      size: "grande",
      controllerOptions: { invocacoesEconomicas: true, melhoriaResistencia: true },
      traits: { bonusPericiaA: true, bonusPericiaB: true, tamanho: true },
    });
    expect(calculated.attributeBase).toBe(10);
    expect(calculated.attributePoints).toBe(20);
    expect(calculated.cost).toBe(5);
    expect(calculated.difficulty).toBe(18);
    expect(calculated.defense).toBe(21);
    expect(calculated.movement).toBe(9);
    expect(calculated.skillSlots).toBe(4);
    expect(calculated.skillBonusPerSelection).toBe(4);
    expect(calculated.sizeAttackModifier).toBe(2);
    expect(calculated.sizeResistanceModifier).toBe(-2);
  });

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
    const allowed = validateInvocationSheet("quarto", { forca: 13, destreza: 11, constituicao: 10 });
    expect(allowed.allocatedPoints).toBe(10);
    expect(allowed.withinPointBudget).toBe(true);
    expect(allowed.withinAttributeCap).toBe(true);

    const invalid = validateInvocationSheet("quarto", { forca: 19, destreza: 10 });
    expect(invalid.withinPointBudget).toBe(false);
    expect(invalid.withinAttributeCap).toBe(true);
    expect(validateInvocationSheet("quarto", { forca: 19, destreza: 10 }, true).withinPointBudget).toBe(true);
  });

  it("gera pendências contextuais para os campos essenciais do construtor", () => {
    const pending = buildHomebrewValidation("A", "", "tecnicas", true, {});
    expect(pending.filter(item => !item.valid)).toHaveLength(4);

    const complete = buildHomebrewValidation("Técnica da Aurora", "Resumo da técnica", "tecnicas", true, {
      tecnicasNarrative: "Uma descrição suficientemente detalhada da técnica.",
      manualNotes: "Esta campanha usa uma exceção narrativa registrada pelo autor.",
      techniqueType: "dano",
      techniqueLevel: 1,
      techniqueCost: 2,
    });
    expect(complete.every(item => item.valid)).toBe(true);
  });

  it("não acusa grau ou orçamento inválidos quando a ficha de Shikigami usa seus defaults visíveis", () => {
    const pending = buildHomebrewValidation("Shikigami de teste", "Resumo da invocação", "shikigami", false, {
      shikigamiNarrative: "Uma invocação configurada com o estado padrão da ficha.",
      shikigami: {},
    });
    expect(pending.find(item => item.key === "shikigami-grade")?.valid).toBe(true);
    expect(pending.find(item => item.key === "shikigami-points")?.valid).toBe(true);
  });

  it("valida mecânicas estruturadas sem presumir regras não documentadas", () => {
    expect(validateStructuredMechanics({ requirements: [{ type: "atributo", valueNumber: 3 }], attributeBonuses: [{ attribute: "forca", value: 2 }], effects: [{ description: "Aplica condição." }] }).valid).toBe(true);
    expect(validateStructuredMechanics({ requirements: [{ type: "", valueText: null }] }).valid).toBe(false);
    expect(validateStructuredMechanics({ requirements: [{ type: "", valueText: null }] }, true).valid).toBe(true);
  });

  it("valida coleções mecânicas estendidas sem presumir fórmulas do livro", () => {
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "PE", amount: 2, details: "Custo" }], damageProfiles: [{ dice: "2d6", damageType: "energia", details: "Dano" }], ranges: [{ range: 12, unit: "metros" }], conditions: [{ name: "Marcado", effect: "Efeito" }], vowExchanges: [{ kind: "gain", description: "Maior foco", valueNumber: 1 }, { kind: "loss", description: "Restrição narrada" }], evolutions: [{ name: "Avanço", description: "Descrição" }] }).valid).toBe(true);
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "", amount: -1, details: "" }], ranges: [{ range: -2, unit: "" }] }).valid).toBe(false);
    expect(validateStructuredExtendedMechanics({ vowExchanges: [{ kind: "gain", description: "", valueNumber: 1.5 }] }).valid).toBe(false);
    expect(validateStructuredExtendedMechanics({ costs: [{ resource: "", amount: -1, details: "" }] }, true).valid).toBe(true);
  });

  it("não depende de campos legados de técnica e voto", () => {
    const technique = buildHomebrewValidation("Técnica", "Resumo", "tecnicas", false, {
      tecnicasNarrative: "Descrição suficiente do funcionamento da técnica.",
      techniqueType: "dano",
      techniqueLevel: 2,
      techniqueCost: 8,
    });
    expect(technique.some(item => item.key.startsWith("technique-"))).toBe(false);

    const vow = buildHomebrewValidation("Voto", "Resumo", "votos", false, {
      votosNarrative: "Descrição suficiente da intenção do voto.",
      vowDuration: "temporario",
      vowWeight: "extremo",
      vowTrade: "Recebo uma vantagem em troca de uma limitação detalhada.",
    });
    expect(vow.some(item => item.key.startsWith("vow-"))).toBe(false);

    const shikigami = buildHomebrewValidation("Shikigami", "Resumo", "shikigami", false, {
      shikigamiNarrative: "Invocação de suporte com atributos e habilidades estruturadas.",
      shikigami: { name: "Kuro", grade: "quarto", attributes: { forca: 5, destreza: 3, constituicao: 2 } },
    });
    expect(shikigami.every(item => item.valid)).toBe(true);
  });
});
