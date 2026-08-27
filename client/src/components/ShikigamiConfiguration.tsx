import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateAttributeModifier,
  calculateShikigamiReferenceStats,
  INVOCATION_GRADE_RULES,
  SHIKIGAMI_TYPE_LABELS,
  SHIKIGAMI_TYPES,
  type InvocationAttribute,
  type InvocationGrade,
  type ShikigamiSize,
  type ShikigamiType,
} from "@shared/homebrewRules";
import { Check, Flame, Plus, Trash2 } from "lucide-react";
import React, { useMemo } from "react";

const ATTRIBUTES = [
  ["forca", "Força"], ["destreza", "Destreza"], ["constituicao", "Constituição"],
  ["inteligencia", "Inteligência"], ["sabedoria", "Sabedoria"], ["carisma", "Carisma"],
] as const satisfies ReadonlyArray<readonly [InvocationAttribute, string]>;

const SKILLS = [
  ["feiticaria", "Feitiçaria", "inteligencia"], ["investigacao", "Investigação", "inteligencia"],
  ["historia", "História", "inteligencia"], ["medicina", "Medicina", "sabedoria"],
  ["religiao", "Religião", "inteligencia"], ["ocultismo", "Ocultismo", "sabedoria"],
  ["prestidigitacao", "Prestidigitação", "destreza"], ["percepcao", "Percepção", "sabedoria"],
  ["intuicao", "Intuição", "sabedoria"], ["furtividade", "Furtividade", "destreza"],
  ["oficio", "Ofício", "inteligencia"], ["reflexos", "Reflexos", "destreza"],
  ["fortitude", "Fortitude", "constituicao"], ["vontade", "Vontade", "sabedoria"],
  ["astucia", "Astúcia", "inteligencia"], ["integridade", "Integridade", "constituicao"],
] as const satisfies ReadonlyArray<readonly [string, string, InvocationAttribute]>;

const CONTROLLER_OPTIONS = [
  ["concentrarPoder", "Concentrar Poder"], ["fantocheSupremo", "Fantoche Supremo"],
  ["invocacoesMoveis", "Invocações Móveis"], ["melhoriaResistencia", "Melhoria: Resistência"],
  ["invocacoesEconomicas", "Invocações Econômicas"], ["melhoriaMobilidade", "Melhoria: Mobilidade"],
  ["invocacoesResistentes", "Invocações Resistentes"], ["melhoriaPrecisao", "Melhoria: Precisão (CD)"],
] as const;

const SIZE_OPTIONS: ReadonlyArray<readonly [ShikigamiSize, string]> = [
  ["minusculo", "Minúsculo"], ["pequeno", "Pequeno"], ["medio", "Médio"],
  ["grande", "Grande"], ["enorme", "Enorme"], ["colossal", "Colossal"],
];

type ShikigamiAbility = { id: string; name: string; description: string; kind?: "acao" | "caracteristica" };
type SkillState = Record<string, { mastery?: boolean; specialty?: boolean; trained?: boolean; otherBonus?: number; manualBonus?: number }>;
type ShikigamiSheet = {
  name?: string;
  type?: ShikigamiType | string;
  grade?: InvocationGrade;
  userLevel?: number;
  mastery?: number;
  proficiencyBonus?: number;
  attributes?: Partial<Record<InvocationAttribute, number>>;
  skills?: SkillState;
  lostHealth?: number;
  healedHealth?: number;
  currentHealth?: number;
  notes?: string;
  controllerOptions?: Record<string, boolean>;
  traits?: Record<string, boolean>;
  movementAttribute?: InvocationAttribute;
  defenseAttribute?: InvocationAttribute;
  bonusSkillA?: string;
  bonusSkillB?: string;
  bonusSkill?: string;
  size?: ShikigamiSize;
  abilities?: ShikigamiAbility[];
};

function asSheet(value: unknown): ShikigamiSheet {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ShikigamiSheet : {};
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function isShikigamiType(value: unknown): value is ShikigamiType {
  return typeof value === "string" && (SHIKIGAMI_TYPES as readonly string[]).includes(value);
}

export function ShikigamiConfiguration({
  manualMode,
  onManualMode,
  data,
  onData,
}: {
  manualMode: boolean;
  onManualMode: (value: boolean) => void;
  data: Record<string, unknown>;
  onData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const sheet = asSheet(data.shikigami);
  const grade = sheet.grade ?? "quarto";
  const type = isShikigamiType(sheet.type) ? sheet.type : "comum";
  const attributes = sheet.attributes ?? {};
  const skills = sheet.skills ?? {};
  const controllerOptions = sheet.controllerOptions ?? {};
  const traits = sheet.traits ?? {};
  const abilities = Array.isArray(sheet.abilities) ? sheet.abilities : [];
  const userLevel = Math.max(1, Number(sheet.userLevel ?? 1));
  const mastery = Math.max(0, Number(sheet.mastery ?? sheet.proficiencyBonus ?? 2));
  const selectedSkills = SKILLS.filter(([key]) => Boolean(skills[key]?.mastery ?? skills[key]?.trained) || Boolean(skills[key]?.specialty)).length;
  const inputAttribute = (key: InvocationAttribute) => Math.max(type === "tecnica" ? 10 : 8, Number(attributes[key] ?? (type === "tecnica" ? 10 : 8)));
  const movementAttribute = ATTRIBUTES.some(([key]) => key === sheet.movementAttribute) ? sheet.movementAttribute! : "destreza";
  const defenseAttribute = ATTRIBUTES.some(([key]) => key === sheet.defenseAttribute) ? sheet.defenseAttribute! : "destreza";
  const size = SIZE_OPTIONS.some(([key]) => key === sheet.size) ? sheet.size! : "medio";
  const additionalEntryCount = abilities.filter(entry => entry.name.trim().length > 0 || entry.description.trim().length > 0).length;
  const stats = useMemo(() => calculateShikigamiReferenceStats({
    grade,
    type,
    attributes,
    userLevel,
    mastery,
    controllerOptions,
    traits,
    defenseAttribute,
    movementAttribute,
    size,
    selectedSkills,
    additionalEntryCount,
  }), [additionalEntryCount, attributes, controllerOptions, defenseAttribute, grade, mastery, movementAttribute, selectedSkills, size, traits, type, userLevel]);
  const allocatedPoints = ATTRIBUTES.reduce((total, [key]) => total + Math.max(0, inputAttribute(key) - stats.attributeBase), 0);
  const overBudget = allocatedPoints > stats.attributePoints;
  const lostHealth = Math.max(0, Number(sheet.lostHealth ?? Math.max(0, stats.health - Number(sheet.currentHealth ?? stats.health))));
  const healedHealth = Math.max(0, Number(sheet.healedHealth ?? 0));
  const currentHealth = Math.max(0, stats.health - lostHealth + healedHealth);
  const updateSheet = (changes: Partial<ShikigamiSheet>) => onData(current => ({ ...current, shikigami: { ...asSheet(current.shikigami), ...changes } }));
  const updateAttribute = (key: InvocationAttribute, value: number) => updateSheet({ attributes: { ...attributes, [key]: Math.max(stats.attributeBase, value || stats.attributeBase) } });
  const updateSkill = (key: string, changes: SkillState[string]) => updateSheet({ skills: { ...skills, [key]: { ...skills[key], ...changes } } });
  const toggle = (group: "controllerOptions" | "traits", key: string) => updateSheet({ [group]: { ...(group === "controllerOptions" ? controllerOptions : traits), [key]: !(group === "controllerOptions" ? controllerOptions[key] : traits[key]) } });
  const updateAbility = (id: string, changes: Partial<ShikigamiAbility>) => updateSheet({ abilities: abilities.map(ability => ability.id === id ? { ...ability, ...changes } : ability) });
  const addAbility = (kind: "acao" | "caracteristica") => updateSheet({ abilities: [...abilities, { id: crypto.randomUUID(), name: "", description: "", kind }] });
  const removeAbility = (id: string) => updateSheet({ abilities: abilities.filter(item => item.id !== id) });

  return <section className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5">
    <header className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-200"><Flame size={16} /></span>
        <div><p className="text-sm font-semibold text-stone-100">Criador de Shikigami</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">Ficha estruturada conforme a planilha de Shikigamis: estado, grau, tipo, atributos, perícias, escolhas e resultados calculados.</p></div>
      </div>
      <button type="button" onClick={() => onManualMode(!manualMode)} className="shrink-0 text-[11px] font-medium text-stone-400 hover:text-stone-200">{manualMode ? "Manual ativo" : "Modo manual"}</button>
    </header>

    <Section title="Estado da invocação" accent>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Máximos" value={String(stats.health)} />
        <NumberField label="Curados" value={healedHealth} min={0} onChange={value => updateSheet({ healedHealth: Math.max(0, value) })} />
        <NumberField label="Perdidos" value={lostHealth} min={0} onChange={value => updateSheet({ lostHealth: Math.max(0, value) })} alert={lostHealth > 0} />
        <Stat label="Atuais" value={String(currentHealth)} alert={currentHealth === 0} />
      </div>
    </Section>

    <Section title="Informações">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <TextField label="Nome" value={sheet.name ?? ""} onChange={name => updateSheet({ name })} />
        <div><Label className="text-xs text-stone-300">Tipo de Shikigami</Label><select value={type} onChange={event => updateSheet({ type: event.target.value as ShikigamiType })} className={selectClass}>{SHIKIGAMI_TYPES.map(value => <option key={value} value={value}>{SHIKIGAMI_TYPE_LABELS[value]}</option>)}</select></div>
        <div><Label className="text-xs text-stone-300">Grau</Label><select value={grade} onChange={event => updateSheet({ grade: event.target.value as InvocationGrade })} className={selectClass}>{Object.keys(INVOCATION_GRADE_RULES).map(value => <option key={value} value={value}>{titleCase(value)} Grau</option>)}</select></div>
        <NumberField label="Nível" value={userLevel} min={1} onChange={value => updateSheet({ userLevel: Math.max(1, value) })} />
        <NumberField label="Maestria" value={mastery} min={0} onChange={value => updateSheet({ mastery: Math.max(0, value) })} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Custo" value={`${stats.cost} PE`} alert={stats.cost < 0} />
        <Stat label="CD" value={String(stats.difficulty)} />
        <Stat label="Classe de Armadura" value={String(stats.defense)} />
        <Stat label="Movimento" value={`${stats.movement.toFixed(1).replace(".", ",")} m`} />
        <Stat label="Atributos restantes" value={String(stats.attributePoints - allocatedPoints)} alert={overBudget} />
        <Stat label="Vagas em perícias" value={String(stats.skillSlots)} alert={stats.skillSlots < 0} />
      </div>
    </Section>

    <Section title="Atributos">
      <div className="flex items-center justify-between gap-3"><p className="text-[10px] text-stone-500">Base {stats.attributeBase} para este tipo. A planilha controla o orçamento total; exceções devem usar o modo manual.</p><span className={`rounded-md px-2 py-1 text-[10px] ${overBudget ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/10 text-emerald-200"}`}>{allocatedPoints}/{stats.attributePoints}</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{ATTRIBUTES.map(([key, label]) => <div key={key} className="rounded-md border border-white/7 p-2"><Label className="text-[10px] text-stone-400">{label}</Label><Input type="number" min={stats.attributeBase} value={inputAttribute(key)} onChange={event => updateAttribute(key, Number(event.target.value))} className="mt-1 h-8 border-white/8 bg-white/[.035] text-xs text-stone-200" /><p className="mt-1 text-[10px] text-rose-200">Modificador: {calculateAttributeModifier(inputAttribute(key)) >= 0 ? "+" : ""}{calculateAttributeModifier(inputAttribute(key))}</p></div>)}</div>
    </Section>

    <Section title="Perícias">
      <p className="text-[10px] text-stone-500">Cada total combina Outros + metade do nível + atributo + Mt./Es. e os bônus escolhidos, tal como na planilha.</p>
      <div className="mt-3 grid gap-1 sm:grid-cols-2">{SKILLS.map(([key, label, attribute]) => {
        const state = skills[key] ?? {};
        const hasMastery = Boolean(state.mastery ?? state.trained);
        const hasSpecialty = Boolean(state.specialty);
        const traitSkillBonus = (traits.bonusPericiaA && (sheet.bonusSkillA ?? sheet.bonusSkill) === key ? stats.skillBonusPerSelection : 0) + (traits.bonusPericiaB && sheet.bonusSkillB === key ? stats.skillBonusPerSelection : 0);
        const total = Number(state.otherBonus ?? state.manualBonus ?? 0) + Math.floor(userLevel / 2) + calculateAttributeModifier(inputAttribute(attribute)) + (hasSpecialty ? stats.skillMasteryBonus : hasMastery ? stats.skillTypeBonus : 0) + traitSkillBonus;
        return <div key={key} className="grid grid-cols-[minmax(0,1fr)_42px_38px_38px_44px] items-center gap-1 rounded-md border border-white/6 px-2 py-1.5 text-[10px]"><span className="truncate text-stone-300">{label} <em className="text-stone-600">{attribute.slice(0, 3).toUpperCase()}</em></span><Input aria-label={`Outros de ${label}`} type="number" value={Number(state.otherBonus ?? state.manualBonus ?? 0)} onChange={event => updateSkill(key, { otherBonus: Number(event.target.value) })} className="h-7 border-white/8 bg-black/10 px-1 text-[10px]" /><label className="flex items-center gap-0.5 text-stone-500"><input aria-label={`Maestria em ${label}`} type="checkbox" checked={hasMastery} onChange={event => updateSkill(key, { mastery: event.target.checked })} />Mt.</label><label className="flex items-center gap-0.5 text-stone-500"><input aria-label={`Especialização em ${label}`} type="checkbox" checked={hasSpecialty} onChange={event => updateSkill(key, { specialty: event.target.checked })} />Es.</label><span className="text-right text-rose-200">{total >= 0 ? "+" : ""}{total}</span></div>;
      })}</div>
    </Section>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <ChoicePanel title="Habilidades de Controlador" options={CONTROLLER_OPTIONS} values={controllerOptions} onToggle={key => toggle("controllerOptions", key)} />
      <section className="rounded-xl border border-white/8 bg-black/10 p-4"><p className="text-xs font-semibold text-stone-200">Características do Shikigami</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Toggle label="Movimento Alternativo" checked={Boolean(traits.movimentoAlternativo)} onChange={() => toggle("traits", "movimentoAlternativo")} /><Toggle label="Defesa Alternativa" checked={Boolean(traits.defesaAlternativa)} onChange={() => toggle("traits", "defesaAlternativa")} /><Toggle label="Bônus em Perícia A" checked={Boolean(traits.bonusPericiaA)} onChange={() => toggle("traits", "bonusPericiaA")} /><Toggle label="Tamanho" checked={Boolean(traits.tamanho)} onChange={() => toggle("traits", "tamanho")} /><Toggle label="Defensor" checked={Boolean(traits.defensor)} onChange={() => toggle("traits", "defensor")} /><Toggle label="Bônus em Perícia B" checked={Boolean(traits.bonusPericiaB)} onChange={() => toggle("traits", "bonusPericiaB")} /><Toggle label="Robustez" checked={Boolean(traits.robustez)} onChange={() => toggle("traits", "robustez")} /><Toggle label="Móvel" checked={Boolean(traits.movel)} onChange={() => toggle("traits", "movel")} /><Toggle label="Perito" checked={Boolean(traits.perito)} onChange={() => toggle("traits", "perito")} /></div></section>
    </div>

    <Section title="Configurações das características">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AttributeSelect label="Movimento alternativo" value={movementAttribute} disabled={!traits.movimentoAlternativo} onChange={movementAttribute => updateSheet({ movementAttribute })} />
        <AttributeSelect label="Defesa alternativa" value={defenseAttribute} disabled={!traits.defesaAlternativa} onChange={defenseAttribute => updateSheet({ defenseAttribute })} />
        <SkillSelect label="Bônus em perícia A" value={sheet.bonusSkillA ?? sheet.bonusSkill ?? "feiticaria"} disabled={!traits.bonusPericiaA} onChange={bonusSkillA => updateSheet({ bonusSkillA })} />
        <SkillSelect label="Bônus em perícia B" value={sheet.bonusSkillB ?? "investigacao"} disabled={!traits.bonusPericiaB} onChange={bonusSkillB => updateSheet({ bonusSkillB })} />
        <div><Label className="text-xs text-stone-300">Tamanho</Label><select disabled={!traits.tamanho} value={size} onChange={event => updateSheet({ size: event.target.value as ShikigamiSize })} className={`${selectClass} disabled:opacity-40`}>{SIZE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {traits.tamanho && <p className="mt-3 text-[10px] text-stone-500">Modificadores da planilha para <strong className="text-stone-300">{SIZE_OPTIONS.find(([value]) => value === size)?.[1]}</strong>: ataques {stats.sizeAttackModifier >= 0 ? "+" : ""}{stats.sizeAttackModifier}; resistências {stats.sizeResistanceModifier >= 0 ? "+" : ""}{stats.sizeResistanceModifier}. Registre-os nas ações ou testes manuais aplicáveis.</p>}
    </Section>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <AbilitySection title="Ações" description="Registre ataques e ações que a planilha não calcula." kind="acao" abilities={abilities} onAdd={addAbility} onChange={updateAbility} onRemove={removeAbility} />
      <AbilitySection title="Características adicionais" description="Registre características narrativas ou efeitos não cobertos pelas opções calculadas." kind="caracteristica" abilities={abilities} onAdd={addAbility} onChange={updateAbility} onRemove={removeAbility} />
    </div>

    <Section title="Anotações">
      <textarea value={sheet.notes ?? ""} onChange={event => updateSheet({ notes: event.target.value })} placeholder="RD, teste de ataque, dano, condições ou outra exceção marcada como manual." className="mt-1 min-h-20 w-full rounded-md border border-white/8 bg-white/[.035] p-2 text-xs text-stone-300" />
    </Section>
    <div className="mt-4 flex gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[.04] p-3 text-[10px] leading-relaxed text-stone-400"><Check size={14} className="shrink-0 text-emerald-300" /> Vida, custo, CD, CA, movimento, atributos e perícias seguem as fórmulas da planilha Google. RD, teste de ataque, dano e outros efeitos não calculados continuam como campos manuais identificados.</div>
  </section>;
}

const selectClass = "mt-1 h-9 w-full rounded-md border border-white/8 bg-[#201b29] px-2 text-xs text-stone-200";

function Section({ title, accent = false, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return <section className={`mt-4 rounded-xl border p-4 ${accent ? "border-fuchsia-300/12 bg-fuchsia-500/[.025]" : "border-white/8 bg-black/10"}`}><p className={`text-[10px] font-semibold uppercase tracking-[.14em] ${accent ? "text-fuchsia-200" : "text-stone-400"}`}>{title}</p><div className="mt-3">{children}</div></section>;
}

function Stat({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className={`rounded-lg border p-2 text-center ${alert ? "border-amber-300/30 bg-amber-500/[.07]" : "border-white/8 bg-black/10"}`}><p className="text-base font-semibold text-rose-100">{value}</p><p className="mt-0.5 text-[9px] uppercase tracking-wide text-stone-500">{label}</p></div>;
}

function NumberField({ label, value, min, onChange, alert = false }: { label: string; value: number; min: number; onChange: (value: number) => void; alert?: boolean }) {
  return <div className={`rounded-lg border p-2 ${alert ? "border-amber-300/30 bg-amber-500/[.07]" : "border-white/8 bg-black/10"}`}><Label className="text-[9px] uppercase text-stone-500">{label}</Label><Input type="number" min={min} value={value} onChange={event => onChange(Number(event.target.value))} className="mt-1 h-7 border-white/8 bg-black/10 text-center text-xs text-rose-100" /></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><Label className="text-xs text-stone-300">{label}</Label><Input value={value} onChange={event => onChange(event.target.value)} className="mt-1 h-9 bg-white/[.035] text-xs text-stone-200" /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className={`flex items-center gap-2 rounded-md border p-2 text-[11px] ${checked ? "border-fuchsia-300/30 bg-fuchsia-500/[.08] text-stone-100" : "border-white/6 text-stone-400"}`}><input type="checkbox" checked={checked} onChange={onChange} /> {label}</label>;
}

function ChoicePanel({ title, options, values, onToggle }: { title: string; options: ReadonlyArray<readonly [string, string]>; values: Record<string, boolean>; onToggle: (key: string) => void }) {
  return <section className="rounded-xl border border-white/8 bg-black/10 p-4"><p className="text-xs font-semibold text-stone-200">{title}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{options.map(([key, label]) => <Toggle key={key} label={label} checked={Boolean(values[key])} onChange={() => onToggle(key)} />)}</div></section>;
}

function AttributeSelect({ label, value, disabled, onChange }: { label: string; value: InvocationAttribute; disabled: boolean; onChange: (value: InvocationAttribute) => void }) {
  return <div><Label className="text-xs text-stone-300">{label}</Label><select disabled={disabled} value={value} onChange={event => onChange(event.target.value as InvocationAttribute)} className={`${selectClass} disabled:opacity-40`}>{ATTRIBUTES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>;
}

function SkillSelect({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <div><Label className="text-xs text-stone-300">{label}</Label><select disabled={disabled} value={value} onChange={event => onChange(event.target.value)} className={`${selectClass} disabled:opacity-40`}>{SKILLS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>;
}

function AbilitySection({ title, description, kind, abilities, onAdd, onChange, onRemove }: { title: string; description: string; kind: "acao" | "caracteristica"; abilities: ShikigamiAbility[]; onAdd: (kind: "acao" | "caracteristica") => void; onChange: (id: string, changes: Partial<ShikigamiAbility>) => void; onRemove: (id: string) => void }) {
  const entries = abilities.filter(item => (item.kind ?? "acao") === kind);
  return <Section title={title}><div className="flex items-start justify-between gap-3"><p className="text-[10px] leading-relaxed text-stone-500">{description}</p><Button type="button" variant="outline" size="sm" onClick={() => onAdd(kind)} className="h-8 shrink-0 border-white/10 text-xs text-stone-200"><Plus size={13} className="mr-1" />Adicionar</Button></div><div className="mt-3 space-y-2">{entries.map((entry, index) => <div key={entry.id} className="rounded-md border border-white/7 p-2"><div className="flex gap-2"><Input value={entry.name} onChange={event => onChange(entry.id, { name: event.target.value })} placeholder={`${kind === "acao" ? "Ação" : "Característica"} ${index + 1}`} className="h-8 bg-black/10 text-xs text-stone-200" /><button type="button" onClick={() => onRemove(entry.id)} aria-label={`Remover ${title.toLowerCase()}`} className="text-stone-500 hover:text-rose-200"><Trash2 size={14} /></button></div><textarea value={entry.description} onChange={event => onChange(entry.id, { description: event.target.value })} placeholder="Descrição, efeito, ataque ou condição." className="mt-2 min-h-16 w-full rounded-md border border-white/8 bg-black/10 p-2 text-xs text-stone-300" /></div>)}{!entries.length && <p className="text-[10px] text-stone-600">Nenhum registro adicional.</p>}</div></Section>;
}
