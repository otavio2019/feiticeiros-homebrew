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

export const STRUCTURED_DAMAGE_TYPES = [
  { value: "cortante", label: "Cortante" },
  { value: "perfurante", label: "Perfurante" },
  { value: "impacto", label: "Impacto" },
  { value: "acido", label: "Ácido" },
  { value: "congelante", label: "Congelante" },
  { value: "chocante", label: "Chocante" },
  { value: "queimante", label: "Queimante" },
  { value: "sonico", label: "Sônico" },
  { value: "alma", label: "na Alma" },
  { value: "energia-reversa", label: "Energia Reversa" },
  { value: "energetico", label: "Energético" },
  { value: "psiquico", label: "Psíquico" },
  { value: "radiante", label: "Radiante" },
  { value: "necrotico", label: "Necrótico" },
  { value: "venenoso", label: "Venenoso" },
] as const;
export const STRUCTURED_DAMAGE_TYPE_VALUES = STRUCTURED_DAMAGE_TYPES.map(item => item.value);

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
export const INVOCATION_ATTRIBUTES = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"] as const;
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

export const SHIKIGAMI_TYPES = ["comum", "tecnica", "manipulacao"] as const;
export type ShikigamiType = (typeof SHIKIGAMI_TYPES)[number];
export const SHIKIGAMI_TYPE_LABELS: Record<ShikigamiType, string> = {
  comum: "Shikigami Comum",
  tecnica: "Shikigami de Técnica",
  manipulacao: "Manipulação de Maldições",
};

export function isShikigamiType(value: unknown): value is ShikigamiType {
  return typeof value === "string" && (SHIKIGAMI_TYPES as readonly string[]).includes(value);
}

export type ShikigamiControllerOption = "concentrarPoder" | "fantocheSupremo" | "invocacoesMoveis" | "invocacoesEconomicas" | "invocacoesResistentes" | "melhoriaResistencia" | "melhoriaMobilidade" | "melhoriaPrecisao";
export type ShikigamiTrait = "movimentoAlternativo" | "defesaAlternativa" | "bonusPericiaA" | "tamanho" | "defensor" | "bonusPericiaB" | "robustez" | "movel" | "perito";
export type ShikigamiSize = "minusculo" | "pequeno" | "medio" | "grande" | "enorme" | "colossal";

export const SHIKIGAMI_GRADE_PROGRESSIONS = {
  quarto: { skillBonus: 2, defenderArmor: 2, robustnessHealth: 5, mobileMovement: 3 },
  terceiro: { skillBonus: 4, defenderArmor: 4, robustnessHealth: 10, mobileMovement: 4.5 },
  segundo: { skillBonus: 6, defenderArmor: 6, robustnessHealth: 15, mobileMovement: 6 },
  primeiro: { skillBonus: 8, defenderArmor: 8, robustnessHealth: 25, mobileMovement: 7.5 },
  especial: { skillBonus: 10, defenderArmor: 12, robustnessHealth: 40, mobileMovement: 9 },
} as const;

export function calculateShikigamiReferenceStats(input: {
  grade: InvocationGrade;
  type?: ShikigamiType;
  attributes: Partial<Record<InvocationAttribute, number>>;
  userLevel: number;
  mastery: number;
  controllerOptions?: Partial<Record<ShikigamiControllerOption, boolean>>;
  traits?: Partial<Record<ShikigamiTrait, boolean>>;
  defenseAttribute?: InvocationAttribute;
  movementAttribute?: InvocationAttribute;
  size?: ShikigamiSize;
  selectedSkills?: number;
  additionalEntryCount?: number;
}) {
  const level = Math.max(1, Math.floor(Number(input.userLevel) || 1));
  const mastery = Math.max(0, Number(input.mastery) || 0);
  const type = input.type ?? "comum";
  const attributes = input.attributes ?? {};
  const attributeBase = type === "tecnica" ? 10 : 8;
  const attributePointsByGrade: Record<ShikigamiType, Record<InvocationGrade, number>> = {
    comum: { quarto: 10, terceiro: 15, segundo: 20, primeiro: 30, especial: 40 },
    tecnica: { quarto: 10, terceiro: 20, segundo: 30, primeiro: 40, especial: 60 },
    manipulacao: { quarto: 10, terceiro: 15, segundo: 20, primeiro: 30, especial: 40 },
  };
  const gradeBonus: Record<InvocationGrade, number> = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };
  const traitProgression = SHIKIGAMI_GRADE_PROGRESSIONS[input.grade];
  const valueOf = (attribute: InvocationAttribute) => Math.max(attributeBase, Number(attributes[attribute] ?? attributeBase));
  const modifierOf = (attribute: InvocationAttribute) => calculateAttributeModifier(valueOf(attribute));
  const constitution = valueOf("constituicao");
  const defenseAttribute = input.defenseAttribute ?? "destreza";
  const movementAttribute = input.movementAttribute ?? "destreza";
  const defenseValue = valueOf(defenseAttribute);
  const controller = input.controllerOptions ?? {};
  const traits = input.traits ?? {};
  const hasPrimarySkillBonus = Boolean(traits.bonusPericiaA || (traits as Record<string, boolean>).bonusPericia);
  const supreme = Boolean(controller.fantocheSupremo);
  const concentrateHealthBonus = controller.concentrarPoder ? (level >= 18 ? 50 : level >= 12 ? 30 : level >= 6 ? 15 : 10) : 0;
  const concentrateDefenseBonus = controller.concentrarPoder ? (level >= 18 ? 6 : level >= 12 ? 4 : level >= 6 ? 2 : 2) : 0;
  const resistanceBonus = controller.melhoriaResistencia ? (level >= 18 ? 5 : level >= 8 ? 3 : 2) : 0;
  const precisionCdBonus = controller.melhoriaPrecisao ? (level >= 18 ? 5 : level >= 8 ? 3 : 2) : 0;
  const globalMobility = controller.invocacoesMoveis ? (level >= 30 ? 10.5 : level >= 25 ? 9 : level >= 20 ? 7.5 : level >= 15 ? 6 : level >= 10 ? 4.5 : level >= 5 ? 3 : 1.5) : 0;
  const controllerMobility = controller.melhoriaMobilidade ? (level >= 16 ? 9 : level >= 12 ? 7.5 : level >= 8 ? 6 : level >= 4 ? 4.5 : 3) : 0;
  const healthBaseByType: Record<ShikigamiType, Record<InvocationGrade, [number, number]>> = {
    comum: { quarto: [5, 2], terceiro: [10, 3], segundo: [15, 4], primeiro: [20, 5], especial: [30, 6] },
    tecnica: { quarto: [5, 2], terceiro: [10, 3], segundo: [15, 4], primeiro: [20, 5], especial: [30, 6] },
    manipulacao: { quarto: [10, 2], terceiro: [20, 3], segundo: [30, 4], primeiro: [40, 5], especial: [60, 6] },
  };
  const [healthFixed, healthConstitution] = healthBaseByType[type][input.grade];
  const health = Math.round((healthFixed + constitution * healthConstitution) / 5) * 5
    + (traits.robustez ? traitProgression.robustnessHealth : 0)
    + (controller.invocacoesResistentes ? mastery * 5 : 0)
    + (supreme ? mastery * 5 : 0)
    + concentrateHealthBonus;
  const defense = 10 + Math.floor(defenseValue / 2) + gradeBonus[input.grade]
    + (traits.defensor ? traitProgression.defenderArmor : 0)
    + resistanceBonus
    + (supreme ? mastery * 2 : 0)
    + concentrateDefenseBonus;
  const baseMovement = type === "tecnica" ? 7.5 : 6;
  const movementModifier = Math.max(0, modifierOf(traits.movimentoAlternativo ? movementAttribute : "destreza")) * 1.5;
  const movement = baseMovement + movementModifier + (traits.movel ? traitProgression.mobileMovement : 0) + globalMobility + controllerMobility + (supreme ? 4.5 : 0);
  const additionalEntryCount = Math.max(0, Number(input.additionalEntryCount) || 0);
  const [costBase, costThreshold] = type === "tecnica"
    ? ({ quarto: [2, 3], terceiro: [5, 4], segundo: [8, 5], primeiro: [10, 6], especial: [12, 7] } as Record<InvocationGrade, [number, number]>)[input.grade]
    : ({ quarto: [2, 2], terceiro: [4, 2], segundo: [6, 3], primeiro: [8, 3], especial: [12, 4] } as Record<InvocationGrade, [number, number]>)[input.grade];
  const cost = costBase + Math.max(0, additionalEntryCount - costThreshold) - (controller.invocacoesEconomicas ? 2 : 0) + (supreme ? 10 : 0);
  const skillBase = type === "tecnica" ? 3 : 2;
  const mentalModifier = Math.max(0, modifierOf("inteligencia"), modifierOf("sabedoria"));
  const selectedSkills = Math.max(0, Number(input.selectedSkills) || 0);
  const skillSlots = skillBase + mentalModifier + (gradeBonus[input.grade] - 1) - selectedSkills + (traits.perito ? 2 : 0);
  const difficulty = 10 + Math.max(1, Math.floor(level / 2)) + Math.max(...INVOCATION_ATTRIBUTES.map(modifierOf)) + gradeBonus[input.grade] + precisionCdBonus;
  return {
    type,
    attributeBase,
    attributePoints: attributePointsByGrade[type][input.grade],
    attributeCap: null,
    health,
    defense,
    movement,
    cost,
    difficulty,
    precisionCdBonus,
    skillSlots,
    skillBonusPerSelection: traitProgression.skillBonus,
    skillBonus: (hasPrimarySkillBonus ? traitProgression.skillBonus : 0) + (traits.bonusPericiaB ? traitProgression.skillBonus : 0),
    defenderArmor: traits.defensor ? traitProgression.defenderArmor : 0,
    skillTypeBonus: type === "tecnica" ? cost : mastery,
    skillMasteryBonus: type === "tecnica" ? cost + Math.floor(mastery / 2) : Math.floor(mastery * 1.5),
    size: input.size ?? "medio",
    sizeAttackModifier: ({ minusculo: -5, pequeno: -2, medio: 0, grande: 2, enorme: 5, colossal: 10 } as Record<ShikigamiSize, number>)[input.size ?? "medio"],
    sizeResistanceModifier: ({ minusculo: 5, pequeno: 2, medio: 0, grande: -2, enorme: -5, colossal: -10 } as Record<ShikigamiSize, number>)[input.size ?? "medio"],
    resistanceRequiresManualEntry: Boolean(controller.melhoriaResistencia),
    attackBonusRequiresManualEntry: Boolean(controller.melhoriaPrecisao),
  };
}

export function validateInvocationSheet(
  grade: InvocationGrade,
  attributes: Partial<Record<InvocationAttribute, number>>,
  manualMode = false,
  type: ShikigamiType = "comum",
) {
  const attributeBase = type === "tecnica" ? 10 : 8;
  const pointBudget: Record<ShikigamiType, Record<InvocationGrade, number>> = {
    comum: { quarto: 10, terceiro: 15, segundo: 20, primeiro: 30, especial: 40 },
    tecnica: { quarto: 10, terceiro: 20, segundo: 30, primeiro: 40, especial: 60 },
    manipulacao: { quarto: 10, terceiro: 15, segundo: 20, primeiro: 30, especial: 40 },
  };
  const values = INVOCATION_ATTRIBUTES.map(attribute => Math.max(attributeBase, Number(attributes[attribute] ?? attributeBase)));
  const allocatedPoints = values.reduce((total, value) => total + Math.max(0, value - attributeBase), 0);
  return {
    allocatedPoints,
    pointBudget: pointBudget[type][grade],
    attributeBase,
    withinPointBudget: manualMode || allocatedPoints <= pointBudget[type][grade],
    withinAttributeCap: true,
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

  if (module === "shikigami") {
    const sheet = isRecord(data.shikigami) ? data.shikigami : {};
    const grade = String(sheet.grade ?? "") as InvocationGrade;
    const type = isShikigamiType(sheet.type) ? sheet.type : "comum";
    const isKnownGrade = grade in INVOCATION_GRADE_RULES;
    const attributes = isRecord(sheet.attributes) ? sheet.attributes as Partial<Record<InvocationAttribute, number>> : {};
    const validation = isKnownGrade
      ? validateInvocationSheet(grade, attributes, manualMode, type)
      : null;
    base.push(
      { key: "shikigami-name", label: "Nome do Shikigami", valid: String(sheet.name ?? "").trim().length >= 3, message: "Informe um nome para o Shikigami." },
      { key: "shikigami-grade", label: "Grau", valid: isKnownGrade, message: "Escolha um grau de invocação válido." },
      { key: "shikigami-points", label: "Pontos de atributo", valid: Boolean(validation?.withinPointBudget), message: "A distribuição excede os pontos previstos para este grau." },
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


export function validateStructuredExtendedMechanics(input: {
  costs?: Array<{ resource: string; amount: number; details: string }>;
  damageProfiles?: Array<{ dice: string; damageType: string; details: string }>;
  ranges?: Array<{ range: number; unit: string }>;
  conditions?: Array<{ name: string; effect: string }>;
  vowExchanges?: Array<{ kind: "gain" | "loss"; description: string; valueNumber?: number | null }>;
  evolutions?: Array<{ name: string; description: string }>;
}, manualMode = false): StructuredMechanicsValidation {
  const errors: string[] = [];
  for (const cost of input.costs ?? []) {
    if (!cost.resource.trim()) errors.push("Custo sem recurso.");
    if (!Number.isInteger(cost.amount) || cost.amount < 0) errors.push("Custo com quantidade inválida.");
    if (!cost.details.trim()) errors.push("Custo sem detalhes.");
  }
  for (const damage of input.damageProfiles ?? []) {
    if (!damage.dice.trim()) errors.push("Perfil de dano sem dados.");
    if (!damage.damageType.trim()) errors.push("Perfil de dano sem tipo.");
    if (!damage.details.trim()) errors.push("Perfil de dano sem detalhes.");
  }
  for (const range of input.ranges ?? []) {
    if (!Number.isInteger(range.range) || range.range < 0) errors.push("Alcance inválido.");
    if (!range.unit.trim()) errors.push("Alcance sem unidade.");
  }
  for (const condition of input.conditions ?? []) {
    if (!condition.name.trim()) errors.push("Condição sem nome.");
    if (!condition.effect.trim()) errors.push("Condição sem efeito.");
  }
  for (const exchange of input.vowExchanges ?? []) {
    if (exchange.kind !== "gain" && exchange.kind !== "loss") errors.push("Troca de Voto sem tipo válido.");
    if (!exchange.description.trim()) errors.push("Ganho ou perda de Voto sem descrição.");
    if (exchange.valueNumber != null && !Number.isInteger(exchange.valueNumber)) errors.push("Troca de Voto com valor numérico inválido.");
  }
  for (const evolution of input.evolutions ?? []) {
    if (!evolution.name.trim()) errors.push("Evolução sem nome.");
    if (!evolution.description.trim()) errors.push("Evolução sem descrição.");
  }
  return { valid: manualMode || errors.length === 0, errors };
}
