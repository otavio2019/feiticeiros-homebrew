import { trpc } from "@/lib/trpc";
import { calculateAttributeModifier, calculateShikigamiReferenceStats, INVOCATION_GRADE_RULES, isShikigamiType, SHIKIGAMI_TYPE_LABELS, type InvocationAttribute, type InvocationGrade, type ShikigamiSize } from "@shared/homebrewRules";
import { ArrowLeft, BookOpen, Copy, Flame, Link2, ShieldCheck, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";
import React from "react";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export default function SharedHomebrew() {
  const [, params] = useRoute("/s/:shareId");
  const shareId = params?.shareId ?? "";
  const query = trpc.homebrew.shared.useQuery({ shareId }, { enabled: Boolean(shareId) && !shareId.endsWith("-demo") });
  const isDemo = shareId.endsWith("-demo");
  const demoHomebrew = shareId === "sombra-demo"
    ? {
        title: "Sombra de Papel Carmesim",
        summary: "Shikigami de suporte especializado em selos, distrações táticas e reconhecimento.",
        modules: [{ id: 1, type: "shikigami" }],
        manualMode: false,
        data: {
          shikigami: {
            name: "Sombra de Papel Carmesim",
            grade: "quarto",
            userLevel: 4,
            proficiencyBonus: 2,
            attributes: { forca: 2, destreza: 4, constituicao: 2, inteligencia: 1, presenca: 1 },
            abilities: [{ id: "demo-selo", name: "Selo de Distração", description: "Cria um selo visível que desloca a atenção de um alvo por um instante." }],
          },
        },
      }
    : { title: "Jardim dos Espelhos Partidos", summary: "Uma técnica de reflexos que converte os danos recebidos em ecos amaldiçoados.", modules: [{ id: 1, type: "origem" }, { id: 2, type: "tecnicas" }, { id: 3, type: "votos" }, { id: 4, type: "shikigami" }], manualMode: false };
  const homebrew = isDemo ? demoHomebrew : query.data;

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success("Link copiado."); }
    catch { toast.message("Use a URL desta página para compartilhar."); }
  };

  if (query.isLoading && !isDemo) return <div className="grid min-h-screen place-items-center bg-[#0e0d15] text-sm text-stone-400">Preparando ficha de leitura...</div>;
  if (!homebrew) return <div className="grid min-h-screen place-items-center bg-[#0e0d15] text-center text-stone-300"><div><p className="text-lg font-semibold">Ficha indisponível</p><Link href="/" className="mt-3 inline-block text-sm text-rose-300">Voltar ao Forge</Link></div></div>;

  const coverImageUrl = "coverImageUrl" in homebrew ? homebrew.coverImageUrl : null;
  const data = "data" in homebrew ? asRecord(homebrew.data) : null;
  const manualNotes = typeof data?.manualNotes === "string" ? data.manualNotes : "";
  const customFields = Array.isArray(data?.customFields) ? data.customFields.map(String) : [];
  const shikigami = asRecord(data?.shikigami);
  const images = "images" in homebrew && Array.isArray(homebrew.images) ? homebrew.images : [];
  const structured = "structured" in homebrew && Array.isArray(homebrew.structured) ? homebrew.structured : [];
  const rootStructuredElements = structured.filter(element => !element.parentElementId);

  return (
    <main className="min-h-screen bg-[#0e0d15] px-4 py-6 text-stone-100 sm:px-7 sm:py-9">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-100"><ArrowLeft size={15} /> Homebrew Forge</Link>
          <button onClick={copy} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/9"><Copy size={14} /> Copiar link</button>
        </header>
        <article className="mt-8 overflow-hidden rounded-3xl border border-white/8 bg-[#17141f] shadow-2xl shadow-black/20">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-rose-900/80 via-[#402044] to-[#171a31]" style={coverImageUrl ? { backgroundImage: `linear-gradient(rgba(40,10,35,.48), rgba(23,20,31,.76)), url(${coverImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>
            <div className="absolute -right-10 -top-14 h-72 w-72 rounded-full border border-rose-200/15" />
            <div className="absolute bottom-7 left-7 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-black/20 text-rose-100"><WandSparkles size={23} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-100/70">Ficha de Homebrew</p><p className="mt-1 text-sm text-rose-50">Feiticeiros & Maldições</p></div></div>
          </div>
          <div className="p-7 sm:p-10">
            <div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="max-w-2xl"><h1 className="font-serif text-3xl font-medium text-white sm:text-4xl">{homebrew.title}</h1><p className="mt-4 text-sm leading-relaxed text-stone-400">{homebrew.summary}</p></div><div className="h-fit rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-right"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Status</p><p className="mt-1 text-xs font-semibold text-emerald-300">Pronta para leitura</p></div></div>
            {homebrew.manualMode && <div className="mt-5 rounded-xl border border-fuchsia-300/15 bg-fuchsia-500/[0.07] p-4 text-[11px] leading-relaxed text-fuchsia-100"><div className="flex items-center gap-2 font-semibold"><WandSparkles size={14} /> Conteúdo personalizado em modo manual</div>{customFields.length > 0 && <div className="mt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fuchsia-200/75">Campos personalizados</p><div className="mt-2 flex flex-wrap gap-1.5">{customFields.map(field => <span key={field} className="rounded-md border border-fuchsia-300/15 bg-black/10 px-2 py-1 text-[10px] text-fuchsia-100">{field}</span>)}</div></div>}{manualNotes ? <p className="mt-3 whitespace-pre-wrap text-stone-300">{manualNotes}</p> : <p className="mt-2 text-stone-400">O autor marcou esta ficha como personalizada; consulte as notas dele para detalhes adicionais.</p>}</div>}
            {shikigami && <ShikigamiReadCard sheet={shikigami} />}
            {structured.length > 0 && <section className="mt-7 rounded-2xl border border-fuchsia-300/12 bg-fuchsia-500/[0.035] p-5"><div className="flex items-center gap-2"><WandSparkles size={16} className="text-fuchsia-300" /><div><h2 className="text-sm font-semibold text-stone-100">Elementos estruturados</h2><p className="mt-1 text-[11px] text-stone-500">Regras separadas por tipo, sem perder marcações manuais.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{rootStructuredElements.map(element => <article key={element.id} className="rounded-xl border border-white/8 bg-black/10 p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-stone-200">{element.name}</h3>{element.isManual && <span className="rounded-md bg-fuchsia-500/15 px-2 py-1 text-[9px] font-semibold text-fuchsia-200">Manual</span>}</div><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-rose-300">{element.type} · {element.ruleSource}</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-stone-400">{element.description}</p>{Array.isArray(element.images) && element.images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{element.images.map(image => <img key={String(image.id)} src={String(image.url)} alt={String(image.altText || `Imagem de ${element.name}`)} className="h-16 w-16 rounded-lg border border-white/10 object-cover" />)}</div>}<StructuredMechanicsReadout mechanics={element.mechanics} />{structured.filter(child => child.parentElementId === element.id).length > 0 && <div className="mt-3 border-t border-white/8 pt-3"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-fuchsia-200">Características vinculadas</p><div className="mt-2 space-y-2">{structured.filter(child => child.parentElementId === element.id).map(child => <div key={child.id} className="rounded-lg border border-white/7 bg-white/[0.025] p-2"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold text-stone-300">{child.name}</p><span className="text-[9px] uppercase text-stone-500">{child.type}</span></div><p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-stone-500">{child.description}</p><StructuredMechanicsReadout mechanics={child.mechanics} /></div>)}</div></div>}</article>)}</div></section>}
            <div className="my-8 border-t border-white/8" />
            <section><div className="flex items-center gap-2"><BookOpen size={16} className="text-rose-300" /><h2 className="text-sm font-semibold text-white">Estrutura da Homebrew</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{homebrew.modules.map(module => { const moduleImage = images.find(image => image.moduleId === module.id); return <div key={module.id} className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.025]">{moduleImage && <img src={moduleImage.url} alt={moduleImage.altText || `Ilustração de ${module.type}`} className="h-24 w-full object-cover" />}<div className="p-4"><div className="flex items-center gap-2 text-xs font-semibold text-stone-200"><Link2 size={14} className="text-rose-300" /> {String(module.type).replace(/^./, letter => letter.toUpperCase())}</div><p className="mt-2 text-[11px] leading-relaxed text-stone-500">Esta seção faz parte da estrutura modular desta ficha.</p></div></div>; })}</div></section>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4"><ShieldCheck size={17} className="mt-0.5 text-emerald-400" /><p className="text-xs leading-relaxed text-stone-400">Esta é uma ficha de leitura. Conteúdos personalizados, quando houver, são identificados pelo autor no construtor.</p></div>
          </div>
        </article>
      </div>
    </main>
  );
}

function StructuredMechanicsReadout({ mechanics }: { mechanics: { requirements: Array<Record<string, unknown>>; attributeBonuses: Array<Record<string, unknown>>; effects: Array<Record<string, unknown>>; costs: Array<Record<string, unknown>>; damageProfiles: Array<Record<string, unknown>>; ranges: Array<Record<string, unknown>>; conditions: Array<Record<string, unknown>>; vowExchanges: Array<Record<string, unknown>>; evolutions: Array<Record<string, unknown>> } }) {
  const formatExchange = (item: Record<string, unknown>) => `${String(item.description)}${item.valueNumber === null || item.valueNumber === undefined ? "" : ` (${String(item.valueNumber)})`}`;
  const groups = [
    ["Requisitos", mechanics.requirements.map(item => `${String(item.type)} ${String(item.operator ?? "")} ${String(item.valueText ?? item.valueNumber ?? "")}`)],
    ["Bônus", mechanics.attributeBonuses.map(item => `${String(item.attribute)} ${Number(item.value) >= 0 ? "+" : ""}${String(item.value)}`)],
    ["Efeitos", mechanics.effects.map(item => `${String(item.effectType)}: ${String(item.description)}`)],
    ["Custos", mechanics.costs.map(item => `${String(item.resource)}: ${String(item.amount)} — ${String(item.details)}`)],
    ["Dano", mechanics.damageProfiles.map(item => `${String(item.dice)}${Number(item.modifier) >= 0 ? "+" : ""}${String(item.modifier)} ${String(item.damageType)}`)],
    ["Alcance", mechanics.ranges.map(item => `${String(item.range)} ${String(item.unit)} · ${String(item.target)}`)],
    ["Condições", mechanics.conditions.map(item => `${String(item.name)}: ${String(item.effect)}`)],
    ["Ganhos", mechanics.vowExchanges.filter(item => item.kind === "gain").map(formatExchange)],
    ["Perdas", mechanics.vowExchanges.filter(item => item.kind === "loss").map(formatExchange)],
    ["Evoluções", mechanics.evolutions.map(item => `${String(item.name)}: ${String(item.description)}`)],
  ].filter(([, values]) => values.length > 0);
  if (!groups.length) return null;
  return <div className="mt-3 space-y-2">{groups.map(([label, values]) => <div key={String(label)}><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">{String(label)}</p><ul className="mt-1 space-y-1">{(values as string[]).map(value => <li key={value} className="text-[10px] leading-relaxed text-stone-400">{value}</li>)}</ul></div>)}</div>;
}

export function ShikigamiReadCard({ sheet }: { sheet: Record<string, unknown> }) {
  const attributes = asRecord(sheet.attributes) ?? {};
  const grade = typeof sheet.grade === "string" && sheet.grade in INVOCATION_GRADE_RULES ? sheet.grade as InvocationGrade : null;
  const type = isShikigamiType(sheet.type) ? sheet.type : "comum";
  const userLevel = Math.max(1, Number(sheet.userLevel ?? 1));
  const mastery = Math.max(0, Number(sheet.mastery ?? sheet.proficiencyBonus ?? 2));
  const controllerOptions = asRecord(sheet.controllerOptions) ?? {};
  const traits = asRecord(sheet.traits) ?? {};
  const skills = asRecord(sheet.skills) ?? {};
  const abilities = Array.isArray(sheet.abilities) ? sheet.abilities.map(asRecord).filter((ability): ability is Record<string, unknown> => Boolean(ability)) : [];
  const validAttribute = (value: unknown): InvocationAttribute => ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"].includes(String(value)) ? String(value) as InvocationAttribute : "destreza";
  const selectedSkills = Object.values(skills).filter(value => { const skill = asRecord(value); return Boolean(skill?.mastery ?? skill?.trained) || Boolean(skill?.specialty); }).length;
  const stats = grade ? calculateShikigamiReferenceStats({ grade, type, attributes: attributes as Partial<Record<InvocationAttribute, number>>, userLevel, mastery, controllerOptions, traits, defenseAttribute: validAttribute(sheet.defenseAttribute), movementAttribute: validAttribute(sheet.movementAttribute), size: String(sheet.size ?? "medio") as ShikigamiSize, selectedSkills, additionalEntryCount: abilities.filter(entry => String(entry.name ?? "").trim() || String(entry.description ?? "").trim()).length }) : null;
  const attributeLabels: Record<InvocationAttribute, string> = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma" };
  const optionLabels: Record<string, string> = { concentrarPoder: "Concentrar Poder", fantocheSupremo: "Fantoche Supremo", invocacoesMoveis: "Invocações Móveis", melhoriaResistencia: "Melhoria: Resistência", invocacoesEconomicas: "Invocações Econômicas", melhoriaMobilidade: "Melhoria: Mobilidade", invocacoesResistentes: "Invocações Resistentes", melhoriaPrecisao: "Melhoria: Precisão (CD)", movimentoAlternativo: "Movimento Alternativo", defesaAlternativa: "Defesa Alternativa", bonusPericiaA: "Bônus em Perícia A", bonusPericiaB: "Bônus em Perícia B", tamanho: "Tamanho", defensor: "Defensor", robustez: "Robustez", movel: "Móvel", perito: "Perito" };
  const selectedOptions = [...Object.entries(controllerOptions), ...Object.entries(traits)].filter(([, value]) => value).map(([key]) => optionLabels[key] ?? key);
  const lostHealth = Math.max(0, Number(sheet.lostHealth ?? (stats ? stats.health - Number(sheet.currentHealth ?? stats.health) : 0)));
  const healedHealth = Math.max(0, Number(sheet.healedHealth ?? 0));
  const currentHealth = stats ? Math.max(0, stats.health - lostHealth + healedHealth) : 0;
  const statEntries = stats ? [["Vida", `${currentHealth}/${stats.health}`], ["Custo", `${stats.cost} PE`], ["CD", stats.difficulty], ["CA", stats.defense], ["Movimento", `${stats.movement.toFixed(1).replace(".", ",")} m`], ["Atributos", stats.attributePoints]] : [];
  const byKind = (kind: string) => abilities.filter(ability => String(ability.kind ?? "acao") === kind);

  return <section className="mt-7 rounded-2xl border border-rose-300/12 bg-rose-500/[0.035] p-5"><div className="flex items-center gap-2"><Flame size={16} className="text-rose-300" /><div><p className="text-sm font-semibold text-stone-100">{String(sheet.name || "Shikigami")}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-stone-500">{SHIKIGAMI_TYPE_LABELS[type]} · {grade ? `${grade} grau` : "grau não definido"} · nível {userLevel}</p></div></div>{statEntries.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{statEntries.map(([label, value]) => <div key={String(label)} className="rounded-lg border border-white/8 bg-black/10 p-2 text-center"><p className="text-sm font-semibold text-rose-100">{String(value)}</p><p className="mt-1 text-[9px] uppercase text-stone-500">{String(label)}</p></div>)}</div>}<div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Atributos</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(attributeLabels).map(([attribute, label]) => { const value = Math.max(stats?.attributeBase ?? 8, Number(attributes[attribute] ?? stats?.attributeBase ?? 8)); return <span key={attribute} className="rounded-md border border-white/8 bg-black/10 px-2 py-1 text-[10px] text-stone-300">{label}: <strong className="text-rose-100">{value}</strong> ({calculateAttributeModifier(value) >= 0 ? "+" : ""}{calculateAttributeModifier(value)})</span>; })}</div></div>{selectedOptions.length > 0 && <div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Opções escolhidas</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedOptions.map(option => <span key={option} className="rounded-md border border-fuchsia-300/15 bg-fuchsia-500/[.08] px-2 py-1 text-[10px] text-fuchsia-100">{option}</span>)}</div></div>}{stats && Boolean(traits.tamanho) && <p className="mt-3 text-[10px] text-stone-500">Tamanho: ataques {stats.sizeAttackModifier >= 0 ? "+" : ""}{stats.sizeAttackModifier}; resistências {stats.sizeResistanceModifier >= 0 ? "+" : ""}{stats.sizeResistanceModifier}.</p>}<ReadEntries title="Ações" entries={byKind("acao")} /><ReadEntries title="Características adicionais" entries={byKind("caracteristica")} />{typeof sheet.notes === "string" && sheet.notes.trim() && <div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Anotações manuais</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-stone-400">{sheet.notes}</p></div>}</section>;
}

function ReadEntries({ title, entries }: { title: string; entries: Record<string, unknown>[] }) {
  if (!entries.length) return null;
  return <div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">{title}</p><div className="mt-2 space-y-2">{entries.map((entry, index) => <div key={String(entry.id ?? index)} className="rounded-lg border border-white/8 bg-black/10 p-3"><p className="text-xs font-semibold text-stone-200">{String(entry.name || `${title.slice(0, -1)} ${index + 1}`)}</p>{typeof entry.description === "string" && entry.description.trim() && <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{entry.description}</p>}</div>)}</div></div>;
}
