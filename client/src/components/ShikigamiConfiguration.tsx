import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateInvocationStats,
  INVOCATION_GRADE_RULES,
  type InvocationGrade,
} from "@shared/homebrewRules";
import { Check, Flame, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

const ATTRIBUTES = [
  ["forca", "Força"],
  ["destreza", "Destreza"],
  ["constituicao", "Constituição"],
  ["inteligencia", "Inteligência"],
  ["presenca", "Presença"],
] as const;

type ShikigamiAbility = { id: string; name: string; description: string };
type ShikigamiSheet = {
  name?: string;
  grade?: InvocationGrade;
  userLevel?: number;
  proficiencyBonus?: number;
  attributes?: Record<string, number>;
  abilities?: ShikigamiAbility[];
};

function asSheet(value: unknown): ShikigamiSheet {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ShikigamiSheet) : {};
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
  const attributes = sheet.attributes ?? {};
  const userLevel = Math.max(1, Number(sheet.userLevel ?? 1));
  const proficiencyBonus = Math.max(0, Number(sheet.proficiencyBonus ?? 2));
  const abilities = Array.isArray(sheet.abilities) ? sheet.abilities : [];
  const stats = useMemo(
    () => calculateInvocationStats(grade, Number(attributes.constituicao ?? 0), Number(attributes.destreza ?? 0), userLevel, proficiencyBonus),
    [attributes.constituicao, attributes.destreza, grade, proficiencyBonus, userLevel],
  );
  const allocatedPoints = ATTRIBUTES.reduce((total, [key]) => total + Math.max(0, Number(attributes[key] ?? 0)), 0);
  const overBudget = allocatedPoints > stats.attributePoints;
  const overCap = ATTRIBUTES.some(([key]) => Number(attributes[key] ?? 0) > stats.attributeCap);

  function updateSheet(changes: Partial<ShikigamiSheet>) {
    onData(current => ({ ...current, shikigami: { ...asSheet(current.shikigami), ...changes } }));
  }

  function updateAttribute(attribute: string, value: number) {
    updateSheet({ attributes: { ...attributes, [attribute]: Math.max(0, value || 0) } });
  }

  function updateAbility(id: string, changes: Partial<ShikigamiAbility>) {
    updateSheet({ abilities: abilities.map(ability => ability.id === id ? { ...ability, ...changes } : ability) });
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-200"><Flame size={16} /></span>
          <div><p className="text-sm font-semibold text-stone-100">Ficha de Shikigami</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">O grau define custo, pontos, limite por atributo, vida e defesa-base. Os demais campos ficam estruturados para futuras interações.</p></div>
        </div>
        <button type="button" onClick={() => onManualMode(!manualMode)} className="shrink-0 text-[11px] font-medium text-stone-400 hover:text-stone-200">{manualMode ? "Manual ativo" : "Modo manual"}</button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><Label className="text-xs text-stone-300">Nome <span className="text-rose-300">*</span></Label><Input value={sheet.name ?? ""} onChange={event => updateSheet({ name: event.target.value })} placeholder="Ex.: Kuro, o Cão de Papel" className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-200" /></div>
        <div><Label className="text-xs text-stone-300">Grau <span className="text-rose-300">*</span></Label><select value={grade} onChange={event => updateSheet({ grade: event.target.value as InvocationGrade })} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-200">{Object.keys(INVOCATION_GRADE_RULES).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)} grau</option>)}</select></div>
        <div><Label className="text-xs text-stone-300">Nível do usuário</Label><Input type="number" min={1} value={userLevel} onChange={event => updateSheet({ userLevel: Math.max(1, Number(event.target.value)) })} className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-200" /></div>
        <div><Label className="text-xs text-stone-300">Bônus de proficiência</Label><Input type="number" min={0} value={proficiencyBonus} onChange={event => updateSheet({ proficiencyBonus: Math.max(0, Number(event.target.value)) })} className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-200" /></div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatChip value={`${stats.cost} PE`} label="Custo" />
        <StatChip value={String(stats.attributePoints)} label="Pontos" />
        <StatChip value={String(stats.attributeCap)} label="Limite" />
        <StatChip value={String(stats.health)} label="Vida" />
        <StatChip value={String(stats.defense)} label="Defesa" />
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-black/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-stone-200">Atributos da invocação</p><p className="mt-1 text-[10px] text-stone-500">Distribua até {stats.attributePoints} pontos; cada atributo pode chegar a {stats.attributeCap}.</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${overBudget || overCap ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/10 text-emerald-200"}`}>{allocatedPoints}/{stats.attributePoints} pontos</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{ATTRIBUTES.map(([key, label]) => <div key={key}><Label className="text-[10px] text-stone-400">{label}</Label><Input type="number" min={0} max={manualMode ? undefined : stats.attributeCap} value={Number(attributes[key] ?? 0)} onChange={event => updateAttribute(key, Number(event.target.value))} className="mt-1 h-9 border-white/8 bg-white/[0.035] text-xs text-stone-200" /></div>)}</div>
        {(overBudget || overCap) && <p className="mt-3 text-[10px] text-amber-200">{manualMode ? "Valor personalizado registrado: " : "Pendência: "}{overBudget ? "os pontos distribuídos excedem o total do grau." : "um atributo excede o limite do grau."}</p>}
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-black/10 p-4">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-stone-200">Habilidades e características</p><p className="mt-1 text-[10px] text-stone-500">Adicione, edite ou remova habilidades sem reduzir a ficha a texto solto.</p></div><Button type="button" variant="outline" size="sm" onClick={() => updateSheet({ abilities: [...abilities, { id: crypto.randomUUID(), name: "", description: "" }] })} className="h-8 border-white/10 text-xs text-stone-200"><Plus size={13} className="mr-1" /> Adicionar</Button></div>
        <div className="mt-4 space-y-3">{abilities.length === 0 ? <p className="rounded-lg border border-dashed border-white/8 px-3 py-3 text-[10px] text-stone-500">Nenhuma habilidade adicionada. Use este espaço para ataques, traços ou efeitos passivos.</p> : abilities.map((ability, index) => <div key={ability.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><div className="flex gap-2"><Input value={ability.name} onChange={event => updateAbility(ability.id, { name: event.target.value })} placeholder={`Habilidade ${index + 1}`} className="h-9 border-white/8 bg-black/10 text-xs text-stone-200" /><button type="button" onClick={() => updateSheet({ abilities: abilities.filter(item => item.id !== ability.id) })} className="grid h-9 w-9 place-items-center rounded-md text-stone-500 hover:bg-rose-500/10 hover:text-rose-200" aria-label="Remover habilidade"><Trash2 size={14} /></button></div><textarea value={ability.description} onChange={event => updateAbility(ability.id, { description: event.target.value })} placeholder="Descreva efeito, condição ou limitação." className="mt-2 min-h-20 w-full resize-none rounded-md border border-white/8 bg-black/10 p-2 text-xs leading-relaxed text-stone-300 outline-none focus:border-rose-300/35" /></div>)}</div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-400"><Check size={13} className="text-emerald-300" /> Vida e defesa são calculadas pelo grau, Constituição, Destreza, nível e proficiência; exceções ficam sinalizadas pelo modo manual.</div>
    </section>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.025] px-2 py-3 text-center"><p className="text-sm font-semibold text-rose-200">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wide text-stone-500">{label}</p></div>;
}
