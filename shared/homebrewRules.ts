export const HOME_BREW_MODULES = [
  "origem",
  "votos",
  "tecnicas",
  "armas",
  "shikigami",
  "mecanicas",
  "aptidoes",
  "especializacoes",
  "outros",
] as const;

export type HomebrewModuleType = (typeof HOME_BREW_MODULES)[number];

export const HOME_BREW_MODULE_LABELS: Record<HomebrewModuleType, string> = {
  origem: "Origem",
  votos: "Votos & Restrições",
  tecnicas: "Técnicas",
  armas: "Armas & Equipamentos",
  shikigami: "Shikigami & Invocações",
  mecanicas: "Mecânicas",
  aptidoes: "Aptidões",
  especializacoes: "Especializações",
  outros: "Outros elementos",
};

export const SPELL_COST_BY_LEVEL = {
  0: 0,
  1: 2,
  2: 5,
  3: 8,
  4: 12,
  5: 20,
} as const;

export function calculateAttributeModifier(value: number) {
  return Math.floor((value - 10) / 2);
}

export function getSpellCost(level: number): number | null {
  if (!Number.isInteger(level) || level < 0 || level > 5) return null;
  return SPELL_COST_BY_LEVEL[level as keyof typeof SPELL_COST_BY_LEVEL];
}

export function isTechniqueCostAllowed(level: number, cost: number, manualMode = false) {
  return manualMode || getSpellCost(level) === cost;
}

export function calculateTechniqueDifficulty(
  characterLevel: number,
  attributeValue: number,
  proficiencyBonus: number,
  otherBonus = 0,
) {
  return 10 + Math.floor(characterLevel / 2) + calculateAttributeModifier(attributeValue) + proficiencyBonus + otherBonus;
}

export type VowDuration = "temporario" | "permanente";
export type VowWeight = "leve" | "medio" | "pesado" | "extremo";

export function isVowCombinationAllowed(duration: VowDuration, weight: VowWeight) {
  if (duration === "temporario") return weight !== "extremo";
  return weight !== "leve";
}

export const INVOCATION_GRADE_RULES = {
  quarto: { cost: 2, points: 10, attributeCap: 16, baseHealth: 10, healthConstitution: 0.5, healthLevel: 1, baseDefense: 10 },
  terceiro: { cost: 4, points: 15, attributeCap: 20, baseHealth: 25, healthConstitution: 0.5, healthLevel: 1, baseDefense: 12 },
  segundo: { cost: 6, points: 20, attributeCap: 24, baseHealth: 40, healthConstitution: 1, healthLevel: 1, baseDefense: 16 },
  primeiro: { cost: 8, points: 30, attributeCap: 26, baseHealth: 60, healthConstitution: 1, healthLevel: 1.5, baseDefense: 20 },
  especial: { cost: 12, points: 40, attributeCap: 30, baseHealth: 80, healthConstitution: 1, healthLevel: 2, baseDefense: 24 },
} as const;

export type InvocationGrade = keyof typeof INVOCATION_GRADE_RULES;
export const INVOCATION_ATTRIBUTES = ["forca", "destreza", "constituicao", "inteligencia", "presenca"] as const;
export type InvocationAttribute = (typeof INVOCATION_ATTRIBUTES)[number];

export function calculateInvocationStats(
  grade: InvocationGrade,
  constitution: number,
  dexterity: number,
  characterLevel: number,
  proficiencyBonus: number,
) {
  const rule = INVOCATION_GRADE_RULES[grade];
  return {
    cost: rule.cost,
    attributePoints: rule.points,
    attributeCap: rule.attributeCap,
    health: Math.floor(rule.baseHealth + constitution * rule.healthConstitution + characterLevel * rule.healthLevel),
    defense: rule.baseDefense + calculateAttributeModifier(dexterity) + proficiencyBonus,
  };
}

export function validateInvocationSheet(
  grade: InvocationGrade,
  attributes: Partial<Record<InvocationAttribute, number>>,
  manualMode = false,
) {
  const rule = INVOCATION_GRADE_RULES[grade];
  const values = INVOCATION_ATTRIBUTES.map(attribute => Math.max(0, Number(attributes[attribute] ?? 0)));
  const allocatedPoints = values.reduce((total, value) => total + value, 0);
  const withinAttributeCap = values.every(value => value <= rule.attributeCap);
  return {
    allocatedPoints,
    pointBudget: rule.points,
    attributeCap: rule.attributeCap,
    withinPointBudget: manualMode || allocatedPoints <= rule.points,
    withinAttributeCap: manualMode || withinAttributeCap,
  };
}

export type HomebrewValidationItem = {
  key: string;
  label: string;
  valid: boolean;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildHomebrewValidation(
  title: string,
  summary: string,
  module: HomebrewModuleType,
  manualMode: boolean,
  data: Record<string, unknown>,
): HomebrewValidationItem[] {
  const narrative = String(data[`${module}Narrative`] ?? "").trim();
  const manualNotes = String(data.manualNotes ?? "").trim();
  const base: HomebrewValidationItem[] = [
    { key: "title", label: "Título", valid: title.trim().length >= 3, message: "Use pelo menos 3 caracteres." },
    { key: "summary", label: "Resumo", valid: summary.trim().length > 0, message: "Inclua um resumo para a ficha de leitura." },
    { key: "narrative", label: `Descrição de ${HOME_BREW_MODULE_LABELS[module]}`, valid: narrative.length >= 12, message: "Descreva o funcionamento deste módulo." },
    { key: "manual", label: "Nota personalizada", valid: !manualMode || manualNotes.length >= 12, message: "Explique a exceção criada no modo manual." },
  ];

  if (module === "tecnicas") {
    const level = Number(data.techniqueLevel);
    const cost = Number(data.techniqueCost);
    base.push(
      { key: "technique-type", label: "Tipo de feitiço", valid: Boolean(String(data.techniqueType ?? "").trim()), message: "Escolha o tipo do feitiço." },
      { key: "technique-level", label: "Nível do feitiço", valid: Number.isInteger(level) && level >= 0 && level <= 5, message: "Informe um nível de feitiço entre 0 e 5." },
      { key: "technique-cost", label: "Custo em energia", valid: isTechniqueCostAllowed(level, cost, manualMode), message: "O custo diverge do padrão do nível escolhido." },
    );
  }

  if (module === "votos") {
    const duration = data.vowDuration as VowDuration;
    const weight = data.vowWeight as VowWeight;
    base.push(
      { key: "vow-duration", label: "Duração do voto", valid: duration === "temporario" || duration === "permanente", message: "Escolha uma duração para o voto." },
      { key: "vow-weight", label: "Peso do voto", valid: ["leve", "medio", "pesado", "extremo"].includes(weight) && isVowCombinationAllowed(duration, weight), message: "Revise a combinação entre duração e peso." },
      { key: "vow-trade", label: "Contrapartida", valid: String(data.vowTrade ?? "").trim().length >= 12, message: "Descreva benefício e malefício do voto." },
    );
  }

  if (module === "shikigami") {
    const sheet = isRecord(data.shikigami) ? data.shikigami : {};
    const grade = String(sheet.grade ?? "") as InvocationGrade;
    const isKnownGrade = grade in INVOCATION_GRADE_RULES;
    const attributes = isRecord(sheet.attributes) ? sheet.attributes as Partial<Record<InvocationAttribute, number>> : {};
    const validation = isKnownGrade
      ? validateInvocationSheet(grade, attributes, manualMode)
      : null;
    base.push(
      { key: "shikigami-name", label: "Nome do Shikigami", valid: String(sheet.name ?? "").trim().length >= 3, message: "Informe um nome para o Shikigami." },
      { key: "shikigami-grade", label: "Grau", valid: isKnownGrade, message: "Escolha um grau de invocação válido." },
      { key: "shikigami-points", label: "Pontos de atributo", valid: Boolean(validation?.withinPointBudget), message: "A distribuição excede os pontos previstos para este grau." },
      { key: "shikigami-cap", label: "Limite por atributo", valid: Boolean(validation?.withinAttributeCap), message: "Um atributo excede o limite previsto para este grau." },
    );
  }

  return base;
}


export type StructuredMechanicsValidation = {
  valid: boolean;
  errors: string[];
};

export function validateStructuredMechanics(input: {
  requirements?: Array<{ type: string; valueText?: string | null; valueNumber?: number | null }>;
  attributeBonuses?: Array<{ attribute: string; value: number }>;
  effects?: Array<{ description: string; valueNumber?: number | null }>;
}, manualMode = false): StructuredMechanicsValidation {
  const errors: string[] = [];
  for (const requirement of input.requirements ?? []) {
    if (!requirement.type.trim()) errors.push("Requisito sem tipo.");
    if (requirement.valueText == null && requirement.valueNumber == null) errors.push("Requisito sem valor.");
  }
  for (const bonus of input.attributeBonuses ?? []) {
    if (!bonus.attribute.trim()) errors.push("Bônus sem atributo.");
    if (!Number.isInteger(bonus.value)) errors.push("Bônus com valor inválido.");
  }
  for (const effect of input.effects ?? []) {
    if (!effect.description.trim()) errors.push("Efeito sem descrição.");
  }
  return { valid: manualMode || errors.length === 0, errors };
}
