import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ShikigamiConfiguration } from "@/components/ShikigamiConfiguration";
import { StructuredChildList } from "@/components/StructuredChildList";
import { StructuredElementSelector } from "@/components/StructuredElementSelector";
import { buildHomebrewValidation, HOME_BREW_MODULE_LABELS, HOME_BREW_MODULES, SPELL_COST_BY_LEVEL, type HomebrewModuleType } from "@shared/homebrewRules";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Copy,
  Crown,
  Feather,
  FilePenLine,
  Flame,
  GalleryVerticalEnd,
  Grid2X2,
  ImagePlus,
  LayoutDashboard,
  LibraryBig,
  Link2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type WorkspaceTab = "visao" | "biblioteca" | "editor";

export function AccountControl({
  user,
  loading,
  onLogin,
  onLogout,
}: {
  user: { name?: string | null } | null;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => Promise<void> | void;
}) {
  const isAuthenticated = Boolean(user);

  return (
    <div className="mt-4 flex items-center gap-3 border-t border-white/7 px-2 pt-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-stone-800 text-xs font-bold text-rose-200">{user?.name ? initials(user.name) : "OT"}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-stone-200">{loading ? "Carregando..." : user?.name || "Visitante"}</p>
        {isAuthenticated ? (
          <button type="button" onClick={() => void onLogout()} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-rose-200" aria-label="Sair da conta">
            <LogOut size={12} /> Sair
          </button>
        ) : (
          <button type="button" onClick={onLogin} className="mt-0.5 text-[11px] text-stone-500 hover:text-stone-300">Entrar para salvar</button>
        )}
      </div>
    </div>
  );
}

const demoHomebrews = [
  {
    id: -1,
    title: "Jardim dos Espelhos Partidos",
    summary: "Uma técnica de reflexos que converte os danos recebidos em ecos amaldiçoados.",
    visibility: "private",
    status: "draft",
    updatedAt: new Date("2026-08-23T19:00:00Z"),
    manualMode: false,
    shareId: "jardim-demo",
  },
  {
    id: -2,
    title: "Voto do Horizonte Vazio",
    summary: "Um voto permanente para técnicas que dependem de distância e percepção.",
    visibility: "unlisted",
    status: "draft",
    updatedAt: new Date("2026-08-19T15:20:00Z"),
    manualMode: true,
    shareId: "horizonte-demo",
  },
  {
    id: -3,
    title: "Sombra de Papel Carmesim",
    summary: "Shikigami de suporte, especializado em selos e distrações táticas.",
    visibility: "public",
    status: "published",
    updatedAt: new Date("2026-08-16T13:00:00Z"),
    manualMode: false,
    shareId: "sombra-demo",
  },
];

const moduleIcons: Record<HomebrewModuleType, typeof WandSparkles> = {
  origem: Sparkles,
  votos: Link2,
  tecnicas: WandSparkles,
  armas: Swords,
  shikigami: Flame,
  mecanicas: Settings2,
  aptidoes: Crown,
  especializacoes: ShieldCheck,
  outros: MoreHorizontal,
};

const moduleDescriptions: Record<HomebrewModuleType, string> = {
  origem: "Defina a base, herança e particularidades do personagem.",
  votos: "Crie trocas, restrições e contrapartidas coerentes.",
  tecnicas: "Estruture o funcionamento, atributo e feitiços da técnica.",
  armas: "Organize armas, propriedades, carga e equipamentos.",
  shikigami: "Monte fichas de invocações e seus atributos calculados.",
  mecanicas: "Registre sistemas auxiliares, estados e regras da Homebrew.",
  aptidoes: "Controle categorias, níveis e pré-requisitos de aptidões.",
  especializacoes: "Descreva progressões, habilidades e atributo-chave.",
  outros: "Inclua elementos que não pertencem aos módulos principais.",
};

const initialModules: HomebrewModuleType[] = ["origem", "tecnicas", "votos", "shikigami"];

const structuredEditorGuidance: Record<HomebrewModuleType, { element: string; detail: string }> = {
  origem: { element: "Herança ou característica", detail: "Descreva origem, benefício e requisito." },
  votos: { element: "Restrição ou contrapartida", detail: "Registre ganho, perda, duração e condição." },
  tecnicas: { element: "Técnica ou feitiço", detail: "Registre custo, dano, alcance e efeitos." },
  armas: { element: "Arma ou equipamento", detail: "Registre dano, alcance, propriedades e vínculo." },
  shikigami: { element: "Shikigami ou habilidade", detail: "Registre grau, atributos, vida, defesa e habilidades." },
  mecanicas: { element: "Regra auxiliar", detail: "Registre estados, gatilhos e progressões." },
  aptidoes: { element: "Aptidão", detail: "Registre nível, atributo e pré-requisitos." },
  especializacoes: { element: "Especialização", detail: "Registre progressão, atributo-chave e efeitos." },
  outros: { element: "Elemento personalizado", detail: "Registre a regra e suas interações." },
};

function initials(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

type ChildCollectionKey = "requirements" | "attributeBonuses" | "effects" | "costs" | "damageProfiles" | "ranges" | "conditions" | "evolutions";
type ChildEditorState = { key: ChildCollectionKey; index: number; values: Record<string, string> };
type ChildEditorField = { key: string; label: string; type?: "number"; control?: "checkbox" };
const childEditorFields: Record<ChildCollectionKey, ChildEditorField[]> = {
  requirements: [{ key: "type", label: "Tipo" }, { key: "operator", label: "Operador" }, { key: "valueText", label: "Valor textual" }, { key: "valueNumber", label: "Valor numérico", type: "number" }],
  attributeBonuses: [{ key: "attribute", label: "Atributo" }, { key: "value", label: "Valor", type: "number" }],
  effects: [{ key: "effectType", label: "Tipo do efeito" }, { key: "description", label: "Descrição" }, { key: "valueNumber", label: "Valor numérico", type: "number" }],
  costs: [{ key: "resource", label: "Recurso" }, { key: "amount", label: "Quantidade", type: "number" }, { key: "details", label: "Detalhes" }],
  damageProfiles: [{ key: "dice", label: "Dados" }, { key: "modifier", label: "Modificador", type: "number" }, { key: "damageType", label: "Tipo de dano" }, { key: "scaling", label: "Escala" }, { key: "details", label: "Detalhes" }],
  ranges: [{ key: "range", label: "Alcance", type: "number" }, { key: "unit", label: "Unidade" }, { key: "area", label: "Área" }, { key: "target", label: "Alvo" }],
  conditions: [{ key: "name", label: "Condição" }, { key: "effect", label: "Efeito" }, { key: "duration", label: "Duração" }],
  evolutions: [{ key: "name", label: "Nome" }, { key: "description", label: "Descrição" }, { key: "ruleSource", label: "Origem da regra" }, { key: "isManual", label: "Modo manual", control: "checkbox" }],
};

function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function StructuredElementsPanel({ homebrewId, moduleId, moduleType }: { homebrewId: number | null; moduleId?: number; moduleType: HomebrewModuleType }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [elementImageUrl, setElementImageUrl] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [requirementType, setRequirementType] = useState("atributo");
  const [requirementValue, setRequirementValue] = useState("");
  const [bonusAttribute, setBonusAttribute] = useState("");
  const [bonusValue, setBonusValue] = useState("1");
  const [effectDescription, setEffectDescription] = useState("");
  const [costResource, setCostResource] = useState("");
  const [costAmount, setCostAmount] = useState("1");
  const [costDetails, setCostDetails] = useState("");
  const [damageDice, setDamageDice] = useState("");
  const [damageType, setDamageType] = useState("");
  const [damageDetails, setDamageDetails] = useState("");
  const [rangeValue, setRangeValue] = useState("0");
  const [rangeUnit, setRangeUnit] = useState("metros");
  const [conditionName, setConditionName] = useState("");
  const [conditionEffect, setConditionEffect] = useState("");
  const [evolutionName, setEvolutionName] = useState("");
  const [evolutionDescription, setEvolutionDescription] = useState("");
  const [selectedWeaponId, setSelectedWeaponId] = useState("");
  const [selectedTechniqueId, setSelectedTechniqueId] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const elementsQuery = trpc.homebrew.structuredList.useQuery({ homebrewId: homebrewId ?? 0, moduleId }, { enabled: Boolean(homebrewId && moduleId) });
  const allElementsQuery = trpc.homebrew.structuredList.useQuery({ homebrewId: homebrewId ?? 0 }, { enabled: Boolean(homebrewId) });
  const weaponTechniqueLinksQuery = trpc.homebrew.structuredWeaponTechniqueLinks.useQuery({ homebrewId: homebrewId ?? 0 }, { enabled: Boolean(homebrewId) });
  const uploadMutation = trpc.homebrew.uploadImage.useMutation({ onSuccess: image => { setElementImageUrl(image.url); toast.success("Imagem carregada e vinculada ao elemento."); }, onError: error => toast.error(error.message) });
  const linkElementImageMutation = trpc.homebrew.addImageUrl.useMutation({ onError: error => toast.error(error.message) });
  const createMutation = trpc.homebrew.structuredCreate.useMutation({ onSuccess: element => { if (element?.id && pendingImageFile) { const reader = new FileReader(); reader.onload = () => { const base64 = String(reader.result).split(",")[1] ?? ""; if (base64) uploadMutation.mutate({ homebrewId: homebrewId ?? 0, elementId: element.id, moduleId, fileName: pendingImageFile.name, contentType: pendingImageFile.type as "image/jpeg" | "image/png" | "image/webp", base64, altText: `Imagem de ${name.trim()}` }); }; reader.readAsDataURL(pendingImageFile); } else if (elementImageUrl.trim() && element?.id) linkElementImageMutation.mutate({ homebrewId: homebrewId ?? 0, elementId: element.id, moduleId, url: elementImageUrl.trim(), altText: `Imagem de ${name.trim()}` }); setPendingImageFile(null); setName(""); setDescription(""); setElementImageUrl(""); elementsQuery.refetch(); toast.success("Elemento estruturado criado."); }, onError: error => toast.error(error.message) });
  const updateMutation = trpc.homebrew.structuredUpdate.useMutation({ onSuccess: () => { setEditingId(null); elementsQuery.refetch(); toast.success("Elemento estruturado atualizado."); }, onError: error => toast.error(error.message) });
  const deleteMutation = trpc.homebrew.structuredDelete.useMutation({ onSuccess: () => elementsQuery.refetch(), onError: error => toast.error(error.message) });
  const removeElementImageMutation = trpc.homebrew.removeImage.useMutation({ onSuccess: () => elementsQuery.refetch(), onError: error => toast.error(error.message) });
  const createWeaponTechniqueLinkMutation = trpc.homebrew.structuredWeaponTechniqueLinkCreate.useMutation({ onSuccess: () => { setSelectedWeaponId(""); setSelectedTechniqueId(""); weaponTechniqueLinksQuery.refetch(); toast.success("Vínculo Arma–Técnica criado."); }, onError: error => toast.error(error.message) });
  const saveWeaponTechniqueLink = () => { if (!selectedWeaponId || !selectedTechniqueId) return; if (editingLinkId) updateWeaponTechniqueLinkMutation.mutate({ homebrewId: homebrewId ?? 0, id: editingLinkId, weaponElementId: Number(selectedWeaponId), techniqueElementId: Number(selectedTechniqueId) }); else createWeaponTechniqueLinkMutation.mutate({ homebrewId: homebrewId ?? 0, weaponElementId: Number(selectedWeaponId), techniqueElementId: Number(selectedTechniqueId) }); };
  const deleteWeaponTechniqueLinkMutation = trpc.homebrew.structuredWeaponTechniqueLinkDelete.useMutation({ onSuccess: () => { setEditingLinkId(null); weaponTechniqueLinksQuery.refetch(); }, onError: error => toast.error(error.message) });
  const updateWeaponTechniqueLinkMutation = trpc.homebrew.structuredWeaponTechniqueLinkUpdate.useMutation({ onSuccess: () => { setEditingLinkId(null); setSelectedWeaponId(""); setSelectedTechniqueId(""); weaponTechniqueLinksQuery.refetch(); toast.success("Vínculo Arma–Técnica atualizado."); }, onError: error => toast.error(error.message) });
  const reorderMutation = trpc.homebrew.structuredReorder.useMutation({ onSuccess: () => elementsQuery.refetch(), onError: error => toast.error(error.message) });
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [childEditor, setChildEditor] = useState<ChildEditorState | null>(null);
  const activeElementId = elementsQuery.data?.some(element => element.id === selectedElementId) ? selectedElementId : elementsQuery.data?.[0]?.id;
  const mechanicsQuery = trpc.homebrew.structuredMechanics.useQuery({ homebrewId: homebrewId ?? 0, elementId: activeElementId ?? 0 }, { enabled: Boolean(homebrewId && activeElementId) });
  const saveMechanicsMutation = trpc.homebrew.structuredSaveMechanics.useMutation({ onSuccess: () => { setRequirementValue(""); setBonusAttribute(""); setEffectDescription(""); mechanicsQuery.refetch(); toast.success("Mecânicas estruturadas salvas."); }, onError: error => toast.error(error.message) });
  const saveExtendedMutation = trpc.homebrew.structuredSaveExtendedMechanics.useMutation({ onSuccess: () => { setCostResource(""); setCostDetails(""); setDamageDice(""); setDamageType(""); setDamageDetails(""); setConditionName(""); setConditionEffect(""); setEvolutionName(""); setEvolutionDescription(""); mechanicsQuery.refetch(); toast.success("Custos, dano e progressões salvos."); }, onError: error => toast.error(error.message) });
  const typeMap: Record<HomebrewModuleType, "origem" | "shikigami" | "voto" | "tecnica" | "feitico" | "arma" | "mecanica" | "aptidao" | "especializacao" | "outro"> = { origem: "origem", shikigami: "shikigami", votos: "voto", tecnicas: "tecnica", armas: "arma", mecanicas: "mecanica", aptidoes: "aptidao", especializacoes: "especializacao", outros: "outro" };
  const weaponElements = allElementsQuery.data?.filter(element => element.type === "arma") ?? [];
  const techniqueElements = allElementsQuery.data?.filter(element => element.type === "tecnica") ?? [];
  const persistCoreMechanics = (requirements: Array<{ type: "atributo" | "nivel" | "origem" | "voto" | "aptidao" | "especializacao" | "tecnica" | "item" | "condicao" | "custom"; operator?: string; valueText?: string | null; valueNumber?: number | null }>, attributeBonuses: Array<{ attribute: string; value: number }>, effects: Array<{ effectType?: "text" | "bonus" | "penalty" | "condition" | "custom"; description: string; valueNumber?: number | null }>) => { if (!activeElementId) return; saveMechanicsMutation.mutate({ homebrewId: homebrewId ?? 0, elementId: activeElementId, requirements, attributeBonuses, effects }); };
  const persistExtendedMechanics = (values: { costs: Array<{ resource: string; amount: number; details: string }>; damageProfiles: Array<{ dice: string; modifier?: number; damageType: string; scaling?: string; details: string }>; ranges: Array<{ range: number; unit: string; area?: string; target?: string }>; conditions: Array<{ name: string; effect: string; duration?: string }>; evolutions: Array<{ name: string; description: string; isManual?: boolean; ruleSource?: "official" | "homebrew" | "manual" }> }) => { if (!activeElementId) return; saveExtendedMutation.mutate({ homebrewId: homebrewId ?? 0, elementId: activeElementId, ...values }); };
  const replaceCoreCollection = (key: "requirements" | "attributeBonuses" | "effects", next: any[]) => { const current = mechanicsQuery.data; if (!current) return; persistCoreMechanics(key === "requirements" ? next : current.requirements.map(item => ({ type: item.type, operator: item.operator, valueText: item.valueText, valueNumber: item.valueNumber })), key === "attributeBonuses" ? next : current.attributeBonuses.map(item => ({ attribute: item.attribute, value: item.value })), key === "effects" ? next : current.effects.map(item => ({ effectType: item.effectType, description: item.description, valueNumber: item.valueNumber }))); };
  const replaceExtendedCollection = (key: "costs" | "damageProfiles" | "ranges" | "conditions" | "evolutions", next: any[]) => { const current = mechanicsQuery.data; if (!current) return; persistExtendedMechanics({ costs: key === "costs" ? next : (current.costs ?? []).map(item => ({ resource: item.resource, amount: item.amount, details: item.details })), damageProfiles: key === "damageProfiles" ? next : (current.damageProfiles ?? []).map(item => ({ dice: item.dice, modifier: item.modifier, damageType: item.damageType, scaling: item.scaling, details: item.details })), ranges: key === "ranges" ? next : (current.ranges ?? []).map(item => ({ range: item.range, unit: item.unit, area: item.area, target: item.target })), conditions: key === "conditions" ? next : (current.conditions ?? []).map(item => ({ name: item.name, effect: item.effect, duration: item.duration })), evolutions: key === "evolutions" ? next : (current.evolutions ?? []).map(item => ({ name: item.name, description: item.description, isManual: item.isManual, ruleSource: item.ruleSource })) }); };
  const editCoreItem = (key: "requirements" | "attributeBonuses" | "effects", index: number) => { const current = mechanicsQuery.data; if (!current) return; const item: any = (current[key] ?? [])[index]; setChildEditor({ key, index, values: Object.fromEntries(childEditorFields[key].map(field => [field.key, item?.[field.key] == null ? "" : String(item[field.key])])) }); };
  const editExtendedItem = (key: "costs" | "damageProfiles" | "ranges" | "conditions" | "evolutions", index: number) => { const current = mechanicsQuery.data; if (!current) return; const item: any = (current[key] ?? [])[index]; setChildEditor({ key, index, values: Object.fromEntries(childEditorFields[key].map(field => [field.key, item?.[field.key] == null ? "" : String(item[field.key])])) }); };
  const saveChildEditor = () => { if (!childEditor || !mechanicsQuery.data) return; const current: any = mechanicsQuery.data; const item: any = (current[childEditor.key] ?? [])[childEditor.index]; if (!item) return; const updated: any = { ...item }; for (const field of childEditorFields[childEditor.key]) { const raw = childEditor.values[field.key] ?? ""; updated[field.key] = field.control === "checkbox" ? raw === "true" : field.type === "number" ? (raw.trim() === "" ? null : Number(raw)) : raw.trim(); } const next = [...(current[childEditor.key] ?? [])] as any[]; next[childEditor.index] = updated; if (["requirements", "attributeBonuses", "effects"].includes(childEditor.key)) replaceCoreCollection(childEditor.key as "requirements" | "attributeBonuses" | "effects", next); else replaceExtendedCollection(childEditor.key as "costs" | "damageProfiles" | "ranges" | "conditions" | "evolutions", next); setChildEditor(null); };
  if (!homebrewId || !moduleId) return null;
  return <section className="rounded-2xl border border-rose-300/12 bg-rose-500/[0.035] p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">Camada estruturada</p><h2 className="mt-1 text-sm font-semibold text-stone-100">Elementos de {HOME_BREW_MODULE_LABELS[moduleType]}</h2><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{structuredEditorGuidance[moduleType].detail} Itens separados do texto legado, com tipo e modo manual preservados.</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-stone-400">{elementsQuery.data?.length ?? 0} itens</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><Input value={name} onChange={event => setName(event.target.value)} placeholder={structuredEditorGuidance[moduleType].element} className="h-9 bg-black/15 text-xs" /><Input value={description} onChange={event => setDescription(event.target.value)} placeholder="Descrição e funcionamento" className="h-9 bg-black/15 text-xs" /><div className="flex gap-1"><Input value={elementImageUrl} onChange={event => setElementImageUrl(event.target.value)} placeholder={pendingImageFile ? `Arquivo: ${pendingImageFile.name}` : "URL da imagem (opcional)"} className="h-9 bg-black/15 text-xs" /><label className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-white/8 bg-white/5 px-3 text-stone-400 hover:bg-white/10"><ImagePlus size={14} /><input type="file" className="hidden" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) setPendingImageFile(file); }} /></label></div><Button disabled={!name.trim() || !description.trim() || createMutation.isPending} onClick={() => createMutation.mutate({ homebrewId, moduleId, type: typeMap[moduleType], name: name.trim(), description: description.trim(), isManual: true })} className="h-9 gap-1 bg-rose-500 px-3 text-xs text-white hover:bg-rose-400"><Plus size={13} /> Adicionar</Button></div>
    <div className="mt-4 space-y-2">{elementsQuery.data?.map((element, index) => <div key={element.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/7 bg-black/10 p-3"><div className="min-w-0 flex-1">{editingId === element.id ? <div className="space-y-2"><Input value={editingName} onChange={event => setEditingName(event.target.value)} className="h-8 bg-black/15 text-xs" /><Input value={editingDescription} onChange={event => setEditingDescription(event.target.value)} className="h-8 bg-black/15 text-xs" /><div className="flex gap-2"><Button size="sm" disabled={!editingName.trim() || !editingDescription.trim() || updateMutation.isPending} onClick={() => updateMutation.mutate({ homebrewId, id: element.id, name: editingName.trim(), description: editingDescription.trim() })}>Salvar</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button></div></div> : <><p className="text-xs font-semibold text-stone-200">{element.name}</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{element.description}</p>{element.images?.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{element.images.map(image => <div key={image.id} className="relative"><img src={image.url} alt={image.altText || `Imagem de ${element.name}`} className="h-12 w-12 rounded-md border border-white/10 object-cover" /><button type="button" aria-label={`Remover imagem de ${element.name}`} onClick={() => removeElementImageMutation.mutate({ homebrewId, imageId: image.id })} className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-black/80 text-[10px] text-rose-200 hover:bg-rose-500">×</button></div>)}</div>}</>}</div><div className="flex items-center gap-1"><button aria-label={`Editar ${element.name}`} onClick={() => { setEditingId(element.id); setEditingName(element.name); setEditingDescription(element.description); }} className="rounded-md p-1.5 text-stone-500 hover:bg-white/8 hover:text-stone-200"><FilePenLine size={13} /></button><button aria-label={`Mover ${element.name} para cima`} disabled={index === 0 || reorderMutation.isPending} onClick={() => reorderMutation.mutate({ homebrewId, id: element.id, direction: "up" })} className="rounded-md p-1.5 text-stone-500 hover:bg-white/8 hover:text-stone-200 disabled:opacity-30"><ArrowUp size={13} /></button><button aria-label={`Mover ${element.name} para baixo`} disabled={index === (elementsQuery.data?.length ?? 1) - 1 || reorderMutation.isPending} onClick={() => reorderMutation.mutate({ homebrewId, id: element.id, direction: "down" })} className="rounded-md p-1.5 text-stone-500 hover:bg-white/8 hover:text-stone-200 disabled:opacity-30"><ArrowDown size={13} /></button><button aria-label={`Excluir ${element.name}`} onClick={() => deleteMutation.mutate({ homebrewId, id: element.id })} className="rounded-md p-1.5 text-stone-500 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={13} /></button></div></div>)}{!elementsQuery.data?.length && <p className="rounded-xl border border-dashed border-white/8 px-3 py-4 text-center text-[11px] text-stone-600">Nenhum elemento estruturado neste módulo ainda.</p>}</div>
    {activeElementId && <div className="mt-5 rounded-xl border border-white/7 bg-black/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200">Mecânicas do elemento selecionado</p><StructuredElementSelector elements={elementsQuery.data ?? []} value={activeElementId} onChange={setSelectedElementId} /></div><div className="mt-3 grid gap-2 sm:grid-cols-4"><select value={requirementType} onChange={event => setRequirementType(event.target.value)} className="h-8 rounded-md border border-white/8 bg-[#201b29] px-2 text-xs text-stone-300"><option value="atributo">Atributo</option><option value="nivel">Nível</option><option value="origem">Origem</option><option value="custom">Customizado</option></select><Input value={requirementValue} onChange={event => setRequirementValue(event.target.value)} placeholder="Valor do requisito" className="h-8 bg-black/15 text-xs" /><Input value={bonusAttribute} onChange={event => setBonusAttribute(event.target.value)} placeholder="Atributo do bônus" className="h-8 bg-black/15 text-xs" /><Input type="number" value={bonusValue} onChange={event => setBonusValue(event.target.value)} placeholder="Valor" className="h-8 bg-black/15 text-xs" /><Input value={effectDescription} onChange={event => setEffectDescription(event.target.value)} placeholder="Descrição do efeito" className="h-8 bg-black/15 text-xs sm:col-span-4" /></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-[10px] text-stone-500">{mechanicsQuery.data ? `${mechanicsQuery.data.requirements.length} requisitos · ${mechanicsQuery.data.attributeBonuses.length} bônus · ${mechanicsQuery.data.effects.length} efeitos` : "Carregando mecânicas..."}</span><Button size="sm" disabled={saveMechanicsMutation.isPending || (!requirementValue.trim() && !bonusAttribute.trim() && !effectDescription.trim())} onClick={() => saveMechanicsMutation.mutate({ homebrewId, elementId: activeElementId, requirements: requirementValue.trim() ? [{ type: requirementType as "atributo", valueText: requirementValue.trim() }] : mechanicsQuery.data?.requirements.map(item => ({ type: item.type, operator: item.operator, valueText: item.valueText, valueNumber: item.valueNumber })) ?? [], attributeBonuses: bonusAttribute.trim() ? [...(mechanicsQuery.data?.attributeBonuses ?? []).map(item => ({ attribute: item.attribute, value: item.value })), { attribute: bonusAttribute.trim(), value: Number(bonusValue) || 1 }] : mechanicsQuery.data?.attributeBonuses.map(item => ({ attribute: item.attribute, value: item.value })) ?? [], effects: effectDescription.trim() ? [...(mechanicsQuery.data?.effects ?? []).map(item => ({ effectType: item.effectType, description: item.description, valueNumber: item.valueNumber })), { effectType: "text", description: effectDescription.trim(), valueNumber: null }] : mechanicsQuery.data?.effects.map(item => ({ effectType: item.effectType, description: item.description, valueNumber: item.valueNumber })) ?? [] })}>Salvar mecânicas</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><StructuredChildList title="Requisitos" items={mechanicsQuery.data?.requirements ?? []} label={(item: any) => `${item.type} ${item.operator ?? ""} ${item.valueText ?? item.valueNumber ?? ""}`} onEdit={index => editCoreItem("requirements", index)} onRemove={index => replaceCoreCollection("requirements", (mechanicsQuery.data?.requirements ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceCoreCollection("requirements", moveItem(mechanicsQuery.data?.requirements ?? [], index, direction))} /><StructuredChildList title="Bônus" items={mechanicsQuery.data?.attributeBonuses ?? []} label={(item: any) => `${item.attribute}: ${item.value}`} onEdit={index => editCoreItem("attributeBonuses", index)} onRemove={index => replaceCoreCollection("attributeBonuses", (mechanicsQuery.data?.attributeBonuses ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceCoreCollection("attributeBonuses", moveItem(mechanicsQuery.data?.attributeBonuses ?? [], index, direction))} reorderable={false} /><StructuredChildList title="Efeitos" items={mechanicsQuery.data?.effects ?? []} label={(item: any) => `${item.effectType ?? "text"}: ${item.description}`} onEdit={index => editCoreItem("effects", index)} onRemove={index => replaceCoreCollection("effects", (mechanicsQuery.data?.effects ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceCoreCollection("effects", moveItem(mechanicsQuery.data?.effects ?? [], index, direction))} /></div></div>}
    {activeElementId && <div className="mt-3 grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-white/7 bg-black/10 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-300">Custo e dano</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><Input value={costResource} onChange={event => setCostResource(event.target.value)} placeholder="Recurso (PE, vida...)" className="h-8 bg-black/15 text-xs" /><Input type="number" value={costAmount} onChange={event => setCostAmount(event.target.value)} placeholder="Quantidade" className="h-8 bg-black/15 text-xs" /><Input value={costDetails} onChange={event => setCostDetails(event.target.value)} placeholder="Detalhes do custo" className="h-8 bg-black/15 text-xs sm:col-span-2" /><Input value={damageDice} onChange={event => setDamageDice(event.target.value)} placeholder="Dados (ex.: 2d6)" className="h-8 bg-black/15 text-xs" /><Input value={damageType} onChange={event => setDamageType(event.target.value)} placeholder="Tipo de dano" className="h-8 bg-black/15 text-xs" /><Input value={damageDetails} onChange={event => setDamageDetails(event.target.value)} placeholder="Detalhes e escala" className="h-8 bg-black/15 text-xs sm:col-span-2" /></div></div><div className="rounded-xl border border-white/7 bg-black/10 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-300">Alcance, condição e evolução</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><Input type="number" value={rangeValue} onChange={event => setRangeValue(event.target.value)} placeholder="Alcance" className="h-8 bg-black/15 text-xs" /><Input value={rangeUnit} onChange={event => setRangeUnit(event.target.value)} placeholder="Unidade" className="h-8 bg-black/15 text-xs" /><Input value={conditionName} onChange={event => setConditionName(event.target.value)} placeholder="Condição" className="h-8 bg-black/15 text-xs" /><Input value={conditionEffect} onChange={event => setConditionEffect(event.target.value)} placeholder="Efeito / duração" className="h-8 bg-black/15 text-xs" /><Input value={evolutionName} onChange={event => setEvolutionName(event.target.value)} placeholder="Nome da evolução" className="h-8 bg-black/15 text-xs" /><Input value={evolutionDescription} onChange={event => setEvolutionDescription(event.target.value)} placeholder="Descrição da evolução" className="h-8 bg-black/15 text-xs" /></div></div><div className="flex justify-end lg:col-span-2"><Button size="sm" disabled={saveExtendedMutation.isPending || (!costResource.trim() && !damageDice.trim() && !conditionName.trim() && !evolutionName.trim())} onClick={() => saveExtendedMutation.mutate({ homebrewId, elementId: activeElementId, costs: costResource.trim() ? [...(mechanicsQuery.data?.costs ?? []).map(item => ({ resource: item.resource, amount: item.amount, details: item.details })), { resource: costResource.trim(), amount: Number(costAmount) || 0, details: costDetails.trim() || "Custo configurado pelo autor." }] : (mechanicsQuery.data?.costs ?? []).map(item => ({ resource: item.resource, amount: item.amount, details: item.details })) ?? [], damageProfiles: damageDice.trim() ? [...(mechanicsQuery.data?.damageProfiles ?? []).map(item => ({ dice: item.dice, modifier: item.modifier, damageType: item.damageType, scaling: item.scaling, details: item.details })), { dice: damageDice.trim(), modifier: 0, damageType: damageType.trim() || "não especificado", scaling: "", details: damageDetails.trim() || "Perfil configurado pelo autor." }] : (mechanicsQuery.data?.damageProfiles ?? []).map(item => ({ dice: item.dice, modifier: item.modifier, damageType: item.damageType, scaling: item.scaling, details: item.details })) ?? [], ranges: rangeValue.trim() ? [...(mechanicsQuery.data?.ranges ?? []).map(item => ({ range: item.range, unit: item.unit, area: item.area, target: item.target })), { range: Number(rangeValue) || 0, unit: rangeUnit.trim() || "metros", area: "", target: "" }] : (mechanicsQuery.data?.ranges ?? []).map(item => ({ range: item.range, unit: item.unit, area: item.area, target: item.target })) ?? [], conditions: conditionName.trim() ? [...(mechanicsQuery.data?.conditions ?? []).map(item => ({ name: item.name, effect: item.effect, duration: item.duration })), { name: conditionName.trim(), effect: conditionEffect.trim() || "Condição definida pelo autor.", duration: "" }] : (mechanicsQuery.data?.conditions ?? []).map(item => ({ name: item.name, effect: item.effect, duration: item.duration })) ?? [], evolutions: evolutionName.trim() ? [...(mechanicsQuery.data?.evolutions ?? []).map(item => ({ name: item.name, description: item.description, isManual: item.isManual, ruleSource: item.ruleSource })), { name: evolutionName.trim(), description: evolutionDescription.trim() || "Evolução definida pelo autor.", isManual: true, ruleSource: "manual" }] : (mechanicsQuery.data?.evolutions ?? []).map(item => ({ name: item.name, description: item.description, isManual: item.isManual, ruleSource: item.ruleSource })) ?? [] })}>Salvar custos, dano e progressões</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><StructuredChildList title="Custos" items={mechanicsQuery.data?.costs ?? []} label={(item: any) => `${item.resource}: ${item.amount} — ${item.details}`} onEdit={index => editExtendedItem("costs", index)} onRemove={index => replaceExtendedCollection("costs", (mechanicsQuery.data?.costs ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceExtendedCollection("costs", moveItem(mechanicsQuery.data?.costs ?? [], index, direction))} /><StructuredChildList title="Dano" items={mechanicsQuery.data?.damageProfiles ?? []} label={(item: any) => `${item.dice} ${item.damageType}: ${item.details}`} onEdit={index => editExtendedItem("damageProfiles", index)} onRemove={index => replaceExtendedCollection("damageProfiles", (mechanicsQuery.data?.damageProfiles ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceExtendedCollection("damageProfiles", moveItem(mechanicsQuery.data?.damageProfiles ?? [], index, direction))} reorderable={false} /><StructuredChildList title="Alcance" items={mechanicsQuery.data?.ranges ?? []} label={(item: any) => `${item.range} ${item.unit}`} onEdit={index => editExtendedItem("ranges", index)} onRemove={index => replaceExtendedCollection("ranges", (mechanicsQuery.data?.ranges ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceExtendedCollection("ranges", moveItem(mechanicsQuery.data?.ranges ?? [], index, direction))} reorderable={false} /><StructuredChildList title="Condições" items={mechanicsQuery.data?.conditions ?? []} label={(item: any) => `${item.name}: ${item.effect}`} onEdit={index => editExtendedItem("conditions", index)} onRemove={index => replaceExtendedCollection("conditions", (mechanicsQuery.data?.conditions ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceExtendedCollection("conditions", moveItem(mechanicsQuery.data?.conditions ?? [], index, direction))} /><StructuredChildList title="Evoluções" items={mechanicsQuery.data?.evolutions ?? []} label={(item: any) => `${item.name}: ${item.description}`} onEdit={index => editExtendedItem("evolutions", index)} onRemove={index => replaceExtendedCollection("evolutions", (mechanicsQuery.data?.evolutions ?? []).filter((_, itemIndex) => itemIndex !== index))} onMove={(index, direction) => replaceExtendedCollection("evolutions", moveItem(mechanicsQuery.data?.evolutions ?? [], index, direction))} /></div></div>}
    {(moduleType === "armas" || moduleType === "tecnicas") && <div className="mt-3 rounded-xl border border-white/7 bg-black/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-300">Relações Arma–Técnica</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><select value={selectedWeaponId} onChange={event => setSelectedWeaponId(event.target.value)} className="h-8 rounded-md border border-white/8 bg-[#201b29] px-2 text-xs text-stone-300"><option value="">Escolha uma arma</option>{weaponElements.map(element => <option key={element.id} value={element.id}>{element.name}</option>)}</select><select value={selectedTechniqueId} onChange={event => setSelectedTechniqueId(event.target.value)} className="h-8 rounded-md border border-white/8 bg-[#201b29] px-2 text-xs text-stone-300"><option value="">Escolha uma técnica</option>{techniqueElements.map(element => <option key={element.id} value={element.id}>{element.name}</option>)}</select><Button size="sm" onClick={saveWeaponTechniqueLink} disabled={!selectedWeaponId || !selectedTechniqueId || createWeaponTechniqueLinkMutation.isPending || updateWeaponTechniqueLinkMutation.isPending}>{editingLinkId ? "Salvar vínculo" : "Vincular"}</Button></div>{(weaponTechniqueLinksQuery.data?.length ?? 0) > 0 && <div className="mt-3 space-y-1">{weaponTechniqueLinksQuery.data?.map(link => { const weapon = allElementsQuery.data?.find(element => element.id === link.weaponElementId); const technique = allElementsQuery.data?.find(element => element.id === link.techniqueElementId); return <div key={link.id} className="flex items-center justify-between rounded-md border border-white/6 px-2 py-1.5 text-[10px] text-stone-400"><span>{weapon?.name ?? `Arma #${link.weaponElementId}`} → {technique?.name ?? `Técnica #${link.techniqueElementId}`}</span><button type="button" aria-label="Editar vínculo Arma–Técnica" onClick={() => { setEditingLinkId(link.id); setSelectedWeaponId(String(link.weaponElementId)); setSelectedTechniqueId(String(link.techniqueElementId)); }} className="text-stone-500 hover:text-fuchsia-200">Editar</button><button type="button" aria-label="Remover vínculo Arma–Técnica" onClick={() => deleteWeaponTechniqueLinkMutation.mutate({ homebrewId, id: link.id })} className="text-stone-500 hover:text-rose-300">×</button></div>; })}</div>}</div>}
    {childEditor && <Dialog open onOpenChange={open => { if (!open) setChildEditor(null); }}><DialogContent className="border-white/10 bg-[#17141f] text-stone-100"><DialogHeader><DialogTitle>Editar item estruturado</DialogTitle><DialogDescription>Atualize todos os campos persistidos deste item sem alterar as demais coleções.</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{childEditorFields[childEditor.key].map(field => <div key={field.key} className={field.control === "checkbox" ? "flex items-center gap-2 pt-6" : ""}><Label className="text-xs text-stone-300">{field.control === "checkbox" ? <><input type="checkbox" checked={childEditor.values[field.key] === "true"} onChange={event => setChildEditor(current => current ? { ...current, values: { ...current.values, [field.key]: String(event.target.checked) } } : current)} className="mr-2 accent-fuchsia-500" />{field.label}</> : field.label}</Label>{field.control !== "checkbox" && <Input type={field.type ?? "text"} value={childEditor.values[field.key] ?? ""} onChange={event => setChildEditor(current => current ? { ...current, values: { ...current.values, [field.key]: event.target.value } } : current)} className="mt-1 h-9 bg-black/15 text-xs" />}</div>)}</div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setChildEditor(null)}>Cancelar</Button><Button onClick={saveChildEditor} disabled={!childEditorFields[childEditor.key].every(field => field.key === "valueNumber" || field.key === "modifier" || field.key === "range" || (childEditor.values[field.key] ?? "").trim())}>Salvar item</Button></div></DialogContent></Dialog>}
  </section>;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const isAuthenticated = Boolean(user);
  const [location, setLocation] = useLocation();
  const [tab, setTab] = useState<WorkspaceTab>("visao");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todas");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedModules, setSelectedModules] = useState<HomebrewModuleType[]>(initialModules);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("private");
  const [manualMode, setManualMode] = useState(false);
  const [editorModules, setEditorModules] = useState<HomebrewModuleType[]>(initialModules);
  const [activeModule, setActiveModule] = useState<HomebrewModuleType>("tecnicas");
  const [editorTitle, setEditorTitle] = useState(demoHomebrews[0].title);
  const [editorSummary, setEditorSummary] = useState(demoHomebrews[0].summary);
  const [activeHomebrewId, setActiveHomebrewId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [draftData, setDraftData] = useState<Record<string, unknown>>({});
  const [attemptedSave, setAttemptedSave] = useState(false);

  const libraryQuery = trpc.homebrew.list.useQuery(undefined, { enabled: isAuthenticated });
  const detailQuery = trpc.homebrew.get.useQuery({ id: activeHomebrewId ?? 0 }, { enabled: Boolean(activeHomebrewId && isAuthenticated) });
  const createMutation = trpc.homebrew.create.useMutation({
    onSuccess: homebrew => {
      libraryQuery.refetch();
      setShowCreate(false);
      setTab("editor");
      setEditorTitle(homebrew?.title ?? title);
      setEditorSummary(homebrew?.summary ?? summary);
      setEditorModules(selectedModules);
      setActiveHomebrewId(homebrew?.id ?? null);
      setCoverImageUrl("");
      setDraftData({});
      toast.success("Estrutura da Homebrew criada.");
    },
    onError: error => toast.error(error.message),
  });
  const saveMutation = trpc.homebrew.update.useMutation({
    onSuccess: () => { libraryQuery.refetch(); toast.success("Alterações salvas no rascunho."); },
    onError: error => toast.error(error.message),
  });
  const addModuleMutation = trpc.homebrew.addModule.useMutation({
    onSuccess: () => { libraryQuery.refetch(); toast.success("Módulo adicionado à estrutura."); },
    onError: error => toast.error(error.message),
  });
  const imageUrlMutation = trpc.homebrew.addImageUrl.useMutation({
    onSuccess: image => {
      setCoverImageUrl(image.url);
      if (activeHomebrewId) saveMutation.mutate({ id: activeHomebrewId, coverImageUrl: image.url });
      detailQuery.refetch();
      toast.success("Imagem vinculada à Homebrew.");
    },
    onError: error => toast.error(error.message),
  });
  const imageUploadMutation = trpc.homebrew.uploadImage.useMutation({
    onSuccess: image => {
      setCoverImageUrl(image.url);
      if (activeHomebrewId) saveMutation.mutate({ id: activeHomebrewId, coverImageUrl: image.url });
      detailQuery.refetch();
      toast.success("Imagem enviada e vinculada à Homebrew.");
    },
    onError: error => toast.error(error.message),
  });
  const removeImageMutation = trpc.homebrew.removeImage.useMutation({
    onSuccess: () => { setCoverImageUrl(""); detailQuery.refetch(); toast.success("Imagem removida da Homebrew."); },
    onError: error => toast.error(error.message),
  });
  const duplicateMutation = trpc.homebrew.duplicate.useMutation({
    onSuccess: () => { libraryQuery.refetch(); toast.success("Cópia criada na sua biblioteca."); },
    onError: error => toast.error(error.message),
  });
  const removeMutation = trpc.homebrew.remove.useMutation({
    onSuccess: () => { libraryQuery.refetch(); toast.success("Homebrew excluída."); },
    onError: error => toast.error(error.message),
  });

  const homebrews = isAuthenticated ? libraryQuery.data ?? [] : demoHomebrews;
  const activeModuleId = detailQuery.data?.modules.find(module => module.type === activeModule)?.id;
  const validationItems = buildHomebrewValidation(editorTitle, editorSummary, activeModule, manualMode, draftData);
  const validationPending = validationItems.filter(item => !item.valid);
  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) return;
    setEditorTitle(detail.title);
    setEditorSummary(detail.summary);
    setManualMode(detail.manualMode);
    setEditorModules(detail.modules.map(module => module.type));
    setActiveModule(detail.modules[0]?.type ?? "outros");
    setCoverImageUrl(detail.coverImageUrl ?? "");
    setDraftData(detail.data ?? {});
  }, [detailQuery.data]);
  const filteredHomebrews = useMemo(() => {
    return homebrews.filter(homebrew => {
      const matchesSearch = `${homebrew.title} ${homebrew.summary}`.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "todas" || homebrew.visibility === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, homebrews, search]);

  const navigate = (nextTab: WorkspaceTab) => {
    setTab(nextTab);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setActiveHomebrewId(null);
      setTab("visao");
      toast.success("Sessão encerrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível encerrar a sessão.");
    }
  };

  const toggleModule = (module: HomebrewModuleType) => {
    setSelectedModules(current => {
      if (current.includes(module)) return current.length === 1 ? current : current.filter(item => item !== module);
      return [...current, module];
    });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.info("Entre para criar e salvar suas Homebrews.");
      startLogin();
      return;
    }
    createMutation.mutate({ title, summary, visibility, manualMode, modules: selectedModules });
  };

  const saveCurrentHomebrew = () => {
    setAttemptedSave(true);
    if (editorTitle.trim().length < 3) { toast.error("Informe um título com pelo menos 3 caracteres."); return; }
    if (!editorSummary.trim()) { toast.error("Adicione um resumo para orientar a leitura da Homebrew."); return; }
    if (!activeHomebrewId || !isAuthenticated) {
      toast.success("Alterações mantidas nesta prévia. Entre e crie uma Homebrew para persistir no seu grimório.");
      return;
    }
    const dataWithValidation = { ...draftData, validation: validationItems, validationUpdatedAt: new Date().toISOString() };
    setDraftData(dataWithValidation);
    saveMutation.mutate({ id: activeHomebrewId, title: editorTitle, summary: editorSummary, manualMode, coverImageUrl: coverImageUrl || null, data: dataWithValidation });
  };

  const addNextModule = () => {
    const next = HOME_BREW_MODULES.find(module => !editorModules.includes(module));
    if (!next) { toast.message("Todos os módulos já estão disponíveis nesta Homebrew."); return; }
    setEditorModules(current => [...current, next]);
    setActiveModule(next);
    if (activeHomebrewId && isAuthenticated) addModuleMutation.mutate({ homebrewId: activeHomebrewId, type: next });
  };

  const linkCoverByUrl = () => {
    if (!coverImageUrl.trim()) { toast.error("Informe uma URL de imagem para vincular."); return; }
    if (!activeHomebrewId || !isAuthenticated) { toast.success("Imagem adicionada à prévia local."); return; }
    imageUrlMutation.mutate({ homebrewId: activeHomebrewId, url: coverImageUrl.trim(), moduleId: activeModuleId, altText: `Imagem de ${HOME_BREW_MODULE_LABELS[activeModule]}` });
  };

  const removeCover = () => {
    const image = detailQuery.data?.images.find(item => item.url === coverImageUrl);
    setCoverImageUrl("");
    if (activeHomebrewId && isAuthenticated) {
      saveMutation.mutate({ id: activeHomebrewId, coverImageUrl: null });
      if (image) removeImageMutation.mutate({ homebrewId: activeHomebrewId, imageId: image.id });
    } else toast.success("Imagem removida da prévia local.");
  };

  const uploadCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Envie uma imagem JPG, PNG ou WEBP."); return; }
    if (file.size > 1_000_000) { toast.error("Use imagens de até 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setCoverImageUrl(dataUrl);
      if (activeHomebrewId && isAuthenticated) {
        imageUploadMutation.mutate({
          homebrewId: activeHomebrewId,
          fileName: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          base64: dataUrl.split(",")[1] ?? "",
          moduleId: activeModuleId,
          altText: `Imagem de ${HOME_BREW_MODULE_LABELS[activeModule]}`,
        });
      } else toast.success("Imagem adicionada à prévia local.");
    };
    reader.readAsDataURL(file);
  };

  const duplicateHomebrew = (id: number) => {
    if (id < 0 || !isAuthenticated) { toast.info("Entre para duplicar Homebrews na sua biblioteca."); return; }
    duplicateMutation.mutate({ id });
  };

  const removeHomebrew = (id: number) => {
    if (id < 0 || !isAuthenticated) { toast.info("Entre para gerenciar os exemplos de biblioteca."); return; }
    if (window.confirm("Excluir esta Homebrew? Esta ação não pode ser desfeita.")) removeMutation.mutate({ id });
  };

  const openEditor = (homebrew: (typeof demoHomebrews)[number]) => {
    setEditorTitle(homebrew.title);
    setEditorSummary(homebrew.summary);
    setManualMode(homebrew.manualMode);
    setActiveHomebrewId(homebrew.id > 0 ? homebrew.id : null);
    setCoverImageUrl("");
    setDraftData({});
    setEditorModules(homebrew.title.includes("Voto") ? ["votos", "tecnicas", "mecanicas"] : initialModules);
    setActiveModule(homebrew.title.includes("Voto") ? "votos" : "tecnicas");
    setTab("editor");
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/s/${detailQuery.data?.shareId ?? "jardim-demo"}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link de leitura copiado.");
    } catch {
      toast.message("Link pronto para compartilhar: " + url);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0d15] text-stone-100 selection:bg-rose-500/35">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="arcane-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-32 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-fuchsia-700/15 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[12rem] h-[26rem] w-[26rem] rounded-full bg-rose-600/10 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-white/7 bg-[#14121c]/95 px-4 py-5 backdrop-blur-xl transition-transform duration-200 lg:sticky lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-2">
            <button className="flex items-center gap-3 text-left" onClick={() => navigate("visao")}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-[0_8px_30px_rgba(225,29,72,0.24)]">
                <WandSparkles size={19} strokeWidth={2.4} />
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight text-white">Homebrew Forge</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-rose-300/80">Feiticeiros & Maldições</span>
              </span>
            </button>
            <button className="rounded-lg p-2 text-stone-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
              <X size={18} />
            </button>
          </div>

          <Button onClick={() => setShowCreate(true)} className="mt-8 h-11 w-full justify-start gap-3 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 font-semibold text-white shadow-[0_10px_30px_rgba(225,29,72,0.22)] hover:from-rose-400 hover:to-fuchsia-500">
            <Plus size={18} /> Criar Homebrew
          </Button>

          <nav className="mt-7 space-y-1.5">
            <SidebarItem icon={LayoutDashboard} label="Visão geral" active={tab === "visao"} onClick={() => navigate("visao")} />
            <SidebarItem icon={LibraryBig} label="Minha biblioteca" active={tab === "biblioteca"} onClick={() => navigate("biblioteca")} />
            <SidebarItem icon={GalleryVerticalEnd} label="Explorar comunidade" active={false} onClick={() => toast.message("A comunidade será conectada aos conteúdos públicos na próxima etapa.")} />
          </nav>

          <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Espaço de criação</div>
          <nav className="mt-3 space-y-1.5">
            <SidebarItem icon={FilePenLine} label="Construtor modular" active={tab === "editor"} onClick={() => navigate("editor")} />
            <SidebarItem icon={ClipboardCheck} label="Validações" active={false} onClick={() => { setTab("editor"); toast.message("Os indicadores de consistência estão disponíveis na prévia do construtor."); }} />
            <SidebarItem icon={Archive} label="Itens salvos" active={false} onClick={() => toast.message("A organização por coleções chega em uma evolução futura.")} />
          </nav>

          <div className="mt-auto rounded-2xl border border-rose-400/10 bg-gradient-to-br from-rose-500/10 to-fuchsia-500/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-200"><BookOpen size={15} /> Mapa de regras</div>
            <p className="mt-2 text-xs leading-relaxed text-stone-400">Campos oficiais têm validação contextual. Conteúdo livre recebe o selo personalizado.</p>
            <button onClick={() => toast.message("O mapa do projeto foi elaborado a partir dos livros enviados.")} className="mt-3 text-xs font-semibold text-rose-300 hover:text-rose-200">Consultar referência <ArrowRight className="ml-1 inline" size={13} /></button>
          </div>

          <AccountControl user={user} loading={loading} onLogin={startLogin} onLogout={handleLogout} />
        </aside>

        <main className="min-w-0 flex-1 lg:ml-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/7 bg-[#0e0d15]/80 px-4 backdrop-blur-xl sm:px-7">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 text-stone-300 hover:bg-white/5 lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
              <div className="hidden text-xs text-stone-500 sm:block"><span className="text-stone-300">Forge</span> <ChevronRight className="mx-1 inline" size={13} /> {tab === "visao" ? "Visão geral" : tab === "biblioteca" ? "Biblioteca" : "Construtor"}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => toast.message("Dicas de preenchimento consultam apenas o conteúdo mapeado nos livros.")} className="grid h-9 w-9 place-items-center rounded-lg border border-white/8 text-stone-400 hover:bg-white/5 hover:text-stone-100"><CircleHelp size={17} /></button>
              {!isAuthenticated && <Button variant="outline" onClick={startLogin} className="hidden h-9 border-white/10 bg-white/4 text-xs text-stone-200 hover:bg-white/8 sm:flex">Entrar</Button>}
              <Button onClick={() => setShowCreate(true)} className="h-9 gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-stone-950 hover:bg-rose-50"><Plus size={15} /> <span className="hidden sm:inline">Nova Homebrew</span></Button>
            </div>
          </header>

          {tab === "visao" && (
            <section className="mx-auto max-w-[1500px] px-4 pb-12 pt-7 sm:px-7 lg:px-10">
              <div className="grid gap-7 xl:grid-cols-[1fr_305px]">
                <div>
                  <div className="rounded-3xl border border-white/8 bg-[#17141f]/75 p-6 shadow-2xl shadow-black/10 sm:p-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                      <div className="max-w-2xl">
                        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-300"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Seu ateliê amaldiçoado</div>
                        <h1 className="font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl">Transforme ideias em <span className="text-rose-300">regras jogáveis.</span></h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-400">Construa Homebrews por módulos, acompanhe validações contextuais e compartilhe uma ficha de leitura sem perder liberdade criativa.</p>
                      </div>
                      <Button onClick={() => setShowCreate(true)} className="h-11 shrink-0 gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 text-white hover:from-rose-400 hover:to-fuchsia-500"><WandSparkles size={17} /> Iniciar criação</Button>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/7 pt-6 sm:grid-cols-4">
                      <Metric value={isAuthenticated ? String(homebrews.length) : "03"} label="Homebrews" />
                      <Metric value="09" label="Módulos possíveis" />
                      <Metric value="100%" label="Modo manual" />
                      <Metric value="01" label="Ficha em revisão" />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div><h2 className="text-base font-semibold text-white">Continue criando</h2><p className="mt-1 text-xs text-stone-500">Os trabalhos mais recentes da sua biblioteca.</p></div>
                    <button onClick={() => navigate("biblioteca")} className="text-xs font-semibold text-rose-300 hover:text-rose-200">Ver biblioteca <ArrowRight className="ml-1 inline" size={14} /></button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {homebrews.length ? homebrews.slice(0, 3).map(homebrew => <HomebrewCard key={homebrew.id} homebrew={homebrew} onClick={() => openEditor(homebrew)} />) : <button onClick={() => setShowCreate(true)} className="col-span-full flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-rose-300/20 bg-rose-500/[0.025] p-5 text-center transition hover:border-rose-300/40 hover:bg-rose-500/[0.06]"><span><span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-200"><Plus size={17} /></span><span className="mt-3 block text-sm font-semibold text-stone-200">Seu grimório ainda está vazio</span><span className="mt-1 block text-[11px] text-stone-500">Comece pelo conceito e selecione os módulos necessários.</span></span></button>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/8 bg-[#17141f]/70 p-5">
                    <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Criação guiada</h2><Sparkles size={16} className="text-rose-300" /></div>
                    <p className="mt-2 text-xs leading-relaxed text-stone-400">Comece escolhendo apenas o que a sua Homebrew precisa. Você pode habilitar mais módulos depois.</p>
                    <div className="mt-5 space-y-3">
                      <ProgressItem label="Definir escopo" active />
                      <ProgressItem label="Montar módulos" active />
                      <ProgressItem label="Revisar consistência" />
                      <ProgressItem label="Publicar ficha" />
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/15 bg-gradient-to-br from-fuchsia-500/12 via-[#1b1524] to-rose-500/10 p-5">
                    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border border-rose-300/20" />
                    <Feather size={19} className="text-rose-200" />
                    <h3 className="mt-4 text-sm font-semibold text-white">Manual, quando precisar.</h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone-400">Altere custos, limites e efeitos sem perder o contexto: o Forge destaca cada exceção como personalizada.</p>
                    <button onClick={() => { setManualMode(true); setTab("editor"); }} className="mt-4 text-xs font-semibold text-rose-200 hover:text-white">Abrir modo avançado <ChevronRight className="inline" size={14} /></button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === "biblioteca" && (
            <section className="mx-auto max-w-[1500px] px-4 pb-12 pt-7 sm:px-7 lg:px-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Arquivo pessoal</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Minha biblioteca</h1><p className="mt-2 text-sm text-stone-500">Pesquise, organize e retome cada conceito que está criando.</p></div>
                <Button onClick={() => setShowCreate(true)} className="h-10 gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"><Plus size={16} /> Criar Homebrew</Button>
              </div>
              <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#17141f]/70 p-3 sm:flex-row sm:items-center">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por título ou descrição..." className="h-10 border-0 bg-white/4 pl-9 text-sm text-stone-200 placeholder:text-stone-600 focus-visible:ring-1 focus-visible:ring-rose-400/50" /></div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[["todas", "Todas"], ["private", "Privadas"], ["unlisted", "Não listadas"], ["public", "Públicas"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${filter === value ? "bg-rose-500/15 text-rose-200" : "text-stone-500 hover:bg-white/5 hover:text-stone-300"}`}>{label}</button>)}
                </div>
              </div>
              {!isAuthenticated && <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-400/10 bg-amber-300/5 px-4 py-3 text-xs text-amber-100/75"><span>Você está vendo três exemplos locais. Entre para abrir sua biblioteca pessoal.</span><button onClick={startLogin} className="font-semibold text-amber-200">Entrar</button></div>}
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredHomebrews.map(homebrew => <HomebrewCard key={homebrew.id} homebrew={homebrew} onClick={() => openEditor(homebrew)} onDuplicate={() => duplicateHomebrew(homebrew.id)} onDelete={() => removeHomebrew(homebrew.id)} detailed />)}
              </div>
              {filteredHomebrews.length === 0 && <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.02] text-center"><div><Search className="mx-auto text-stone-600" size={28} /><p className="mt-3 text-sm font-medium text-stone-300">Nenhuma Homebrew encontrada</p><p className="mt-1 text-xs text-stone-500">Ajuste os filtros ou crie um novo conceito.</p></div></div>}
            </section>
          )}

          {tab === "editor" && (
            <section className="h-[calc(100vh-64px)] overflow-hidden">
              <div className="flex h-full min-w-[760px]">
                <div className="w-[228px] shrink-0 overflow-y-auto border-r border-white/7 bg-[#121019]/70 px-3 py-5">
                  <div className="px-3"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">Homebrew em edição</span><h2 className="mt-2 line-clamp-2 text-sm font-semibold text-stone-100">{editorTitle}</h2></div>
                  <div className="mt-6 space-y-1">
                    {editorModules.map(module => {
                      const Icon = moduleIcons[module];
                      return <button key={module} onClick={() => setActiveModule(module)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${activeModule === module ? "bg-rose-500/14 text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.12)]" : "text-stone-500 hover:bg-white/4 hover:text-stone-200"}`}><Icon size={16} className={activeModule === module ? "text-rose-300" : ""} /><span>{HOME_BREW_MODULE_LABELS[module]}</span>{activeModule === module && <ChevronRight size={14} className="ml-auto" />}</button>;
                    })}
                  </div>
                  <button onClick={addNextModule} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-xs text-stone-500 hover:border-rose-300/25 hover:text-rose-200"><Plus size={15} /> Adicionar módulo</button>
                  <div className={`mt-6 rounded-xl border p-3 ${validationPending.length ? "border-amber-400/15 bg-amber-400/[0.035]" : "border-emerald-400/15 bg-emerald-400/[0.04]"}`}><div className="flex gap-2"><ShieldCheck size={15} className={`mt-0.5 ${validationPending.length ? "text-amber-300" : "text-emerald-400"}`} /><div><p className="text-[11px] font-semibold text-stone-200">{validationPending.length ? `${validationPending.length} pendência${validationPending.length > 1 ? "s" : ""}` : "4 verificações concluídas"}</p><p className="mt-1 text-[10px] leading-relaxed text-stone-500">{validationPending.length ? validationPending[0]?.message : "Campos essenciais e consistência contextual confirmados."}</p></div></div></div>
                </div>

                <div className="min-w-0 flex-1 overflow-y-auto bg-[#0e0d15]/35 px-7 py-7 xl:px-10">
                  <div className="mx-auto max-w-3xl">
                    <div className="flex items-start justify-between gap-5">
                      <div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Módulo ativo</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{HOME_BREW_MODULE_LABELS[activeModule]}</h1><p className="mt-2 max-w-xl text-xs leading-relaxed text-stone-500">{moduleDescriptions[activeModule]}</p></div>
                      <button onClick={saveCurrentHomebrew} className="rounded-lg border border-white/9 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-white/9"><Check className="mr-1.5 inline text-emerald-400" size={14} /> Salvar</button>
                    </div>

                    <div className="mt-7 space-y-4">
                      <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5">
                        <SectionHeader number="01" title="Identidade" description="Dê contexto claro para que a Homebrew seja fácil de entender e consultar." />
                        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label className="text-xs font-medium text-stone-300">Título da Homebrew <span className="text-rose-300">*</span></Label><Input value={editorTitle} onChange={event => setEditorTitle(event.target.value)} className={`mt-2 h-10 bg-white/[0.035] text-xs text-stone-300 ${attemptedSave && editorTitle.trim().length < 3 ? "border-rose-400/70" : "border-white/8"}`} />{attemptedSave && editorTitle.trim().length < 3 && <p className="mt-1 text-[10px] text-rose-300">Use pelo menos 3 caracteres.</p>}</div><Field label={activeModule === "tecnicas" ? "Atributo da técnica" : "Classificação"} value={activeModule === "tecnicas" ? "Sabedoria" : "Oficial"} select /></div>
                        <div className="mt-4"><Label className="text-xs font-medium text-stone-300">Resumo <span className="text-rose-300">*</span></Label><textarea value={editorSummary} onChange={event => setEditorSummary(event.target.value)} placeholder="Resuma a proposta e o uso desta Homebrew." className={`mt-2 min-h-20 w-full resize-none rounded-xl bg-white/[0.035] p-3 text-xs leading-relaxed text-stone-300 outline-none placeholder:text-stone-600 focus:border-rose-400/35 ${attemptedSave && !editorSummary.trim() ? "border border-rose-400/70" : "border border-white/8"}`} />{attemptedSave && !editorSummary.trim() && <p className="mt-1 text-[10px] text-rose-300">O resumo ajuda a orientar a ficha de leitura.</p>}</div>
                        <div className="mt-4"><Label className="text-xs font-medium text-stone-300">Funcionamento e narrativa</Label><textarea value={String(draftData[`${activeModule}Narrative`] ?? (activeModule === "tecnicas" ? "A técnica fragmenta a percepção do usuário em superfícies refletoras, permitindo registrar e devolver impulsos de energia amaldiçoada." : "Descreva o funcionamento narrativo e os detalhes mecânicos deste elemento."))} onChange={event => setDraftData(current => ({ ...current, [`${activeModule}Narrative`]: event.target.value }))} className="mt-2 min-h-28 w-full resize-none rounded-xl border border-white/8 bg-white/[0.035] p-3 text-xs leading-relaxed text-stone-300 outline-none placeholder:text-stone-600 focus:border-rose-400/35" /></div>
                        <OptionalImagePanel imageUrl={coverImageUrl} onUrlChange={setCoverImageUrl} onLinkUrl={linkCoverByUrl} onUpload={uploadCover} onRemove={removeCover} />
                      </div>

                      {activeModule === "tecnicas" && <TechniqueConfiguration manualMode={manualMode} onManualMode={setManualMode} data={draftData} onData={setDraftData} />}
                      {activeModule === "votos" && <VowConfiguration manualMode={manualMode} onManualMode={setManualMode} data={draftData} onData={setDraftData} />}
                      {activeModule === "shikigami" && <ShikigamiConfiguration manualMode={manualMode} onManualMode={setManualMode} data={draftData} onData={setDraftData} />}
                      <StructuredElementsPanel homebrewId={activeHomebrewId} moduleId={activeModuleId} moduleType={activeModule} />
                      {!["tecnicas", "votos", "shikigami"].includes(activeModule) && <SpecificModuleConfiguration module={activeModule} manualMode={manualMode} onManualMode={setManualMode} data={draftData} onData={setDraftData} />}
                      {manualMode && <ManualNotes value={String(draftData.manualNotes ?? "")} customFields={Array.isArray(draftData.customFields) ? draftData.customFields.map(String) : []} onChange={value => setDraftData(current => ({ ...current, manualNotes: value, containsCustomContent: true }))} onFieldsChange={fields => setDraftData(current => ({ ...current, customFields: fields, containsCustomContent: true }))} />}
                      <ValidationPanel items={validationItems} />

                      <div className="flex justify-between border-t border-white/7 pt-2"><button onClick={() => navigate("biblioteca")} className="text-xs font-semibold text-stone-500 hover:text-stone-300">← Voltar para a biblioteca</button><Button onClick={saveCurrentHomebrew} className="h-9 rounded-lg bg-rose-500 px-4 text-xs text-white hover:bg-rose-400">Salvar módulo</Button></div>
                    </div>
                  </div>
                </div>

                <aside className="w-[318px] shrink-0 overflow-y-auto border-l border-white/7 bg-[#121019]/80 p-5">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Prévia</p><h3 className="mt-1 text-sm font-semibold text-white">Ficha de leitura</h3></div><button onClick={copyShareLink} className="rounded-lg border border-white/8 p-2 text-stone-400 hover:bg-white/5 hover:text-rose-200" aria-label="Copiar link"><Copy size={15} /></button></div>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-rose-300/10 bg-[#1b1622] shadow-2xl shadow-black/20">
                    <div className="relative h-24 overflow-hidden bg-gradient-to-br from-rose-900/70 via-[#3c1d45] to-[#161b32]"><div className="absolute -right-6 -top-12 h-36 w-36 rounded-full border border-rose-100/15" /><div className="absolute bottom-3 left-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200/20 bg-black/20 text-rose-100"><WandSparkles size={15} /></span><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-100/80">Homebrew</span></div></div>
                    <div className="p-4"><h4 className="font-serif text-lg leading-tight text-stone-50">{editorTitle}</h4><p className="mt-2 text-[11px] leading-relaxed text-stone-400">{editorSummary}</p><div className="mt-4 flex flex-wrap gap-1.5">{editorModules.map(module => <span key={module} className="rounded-md bg-white/5 px-2 py-1 text-[9px] font-medium text-stone-400">{HOME_BREW_MODULE_LABELS[module]}</span>)}</div><div className="mt-5 border-t border-white/8 pt-4"><div className="flex items-center justify-between text-[10px]"><span className="text-stone-500">Status</span><span className="font-semibold text-amber-200">Rascunho</span></div><div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-stone-500">Modo manual</span><span className={manualMode ? "font-semibold text-fuchsia-200" : "font-semibold text-emerald-300"}>{manualMode ? "Ativo" : "Desativado"}</span></div></div></div>
                  </div>
                  <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3"><div className="flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-emerald-400" /><div><p className="text-[11px] font-semibold text-emerald-100">Consistência contextual</p><p className="mt-1 text-[10px] leading-relaxed text-stone-500">A estrutura inclui os campos necessários para revisão. O balanceamento narrativo continua sob decisão do Narrador.</p></div></div></div>
                  <button onClick={() => { setLocation(`/s/${detailQuery.data?.shareId ?? "jardim-demo"}`); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 py-2.5 text-xs font-semibold text-stone-300 hover:bg-white/5"><Link2 size={14} /> Abrir modo leitura</button>
                </aside>
              </div>
            </section>
          )}
        </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-[#17141f] p-0 text-stone-100 sm:rounded-3xl">
          <form onSubmit={handleCreate}>
            <DialogHeader className="border-b border-white/8 px-6 pb-5 pt-6 sm:px-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300"><span className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/15"><Plus size={13} /></span> Nova criação</div><DialogTitle className="mt-3 text-2xl text-white">O que você deseja adicionar?</DialogTitle><DialogDescription className="text-sm leading-relaxed text-stone-400">Em vez de uma ficha gigante, escolha só os módulos que sustentam a sua ideia. Todos podem ser ampliados depois.</DialogDescription></DialogHeader>
            <div className="px-6 py-6 sm:px-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {HOME_BREW_MODULES.map(module => { const Icon = moduleIcons[module]; const selected = selectedModules.includes(module); return <button key={module} type="button" onClick={() => toggleModule(module)} className={`group relative rounded-2xl border p-4 text-left transition ${selected ? "border-rose-400/35 bg-rose-500/[0.10] shadow-[0_12px_30px_rgba(225,29,72,0.08)]" : "border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.045]"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${selected ? "bg-rose-500 text-white" : "bg-white/6 text-stone-400"}`}><Icon size={17} /></span><p className="mt-3 text-sm font-semibold text-stone-100">{HOME_BREW_MODULE_LABELS[module]}</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{moduleDescriptions[module]}</p>{selected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white"><Check size={12} /></span>}</button>; })}
              </div>
              <div className="mt-7 grid gap-4 border-t border-white/8 pt-6 sm:grid-cols-2"><div><Label className="text-xs text-stone-300">Título da Homebrew</Label><Input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Ritual das Mil Lanternas" className="mt-2 h-10 border-white/10 bg-white/[0.035] text-sm placeholder:text-stone-600" /></div><div><Label className="text-xs text-stone-300">Visibilidade</Label><select value={visibility} onChange={event => setVisibility(event.target.value as typeof visibility)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#201b29] px-3 text-sm text-stone-300 outline-none focus:border-rose-400/35"><option value="private">Privada — apenas eu</option><option value="unlisted">Não listada — com link</option><option value="public">Pública — comunidade</option></select></div><div className="sm:col-span-2"><Label className="text-xs text-stone-300">Resumo <span className="text-stone-600">(opcional)</span></Label><Input value={summary} onChange={event => setSummary(event.target.value)} placeholder="Qual é o conceito central desta criação?" className="mt-2 h-10 border-white/10 bg-white/[0.035] text-sm placeholder:text-stone-600" /></div></div>
              <button type="button" onClick={() => setManualMode(value => !value)} className={`mt-5 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${manualMode ? "border-fuchsia-400/25 bg-fuchsia-500/[0.08]" : "border-white/8 bg-white/[0.025]"}`}><span className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${manualMode ? "bg-fuchsia-500 text-white" : "bg-white/6 text-stone-400"}`}><Feather size={15} /></span><span><span className="block text-xs font-semibold text-stone-200">Modo manual / Homebrew avançada</span><span className="mt-0.5 block text-[11px] text-stone-500">Permite modificar valores e regras, sempre marcados como personalizados.</span></span></span><span className={`h-5 w-9 rounded-full p-0.5 transition ${manualMode ? "bg-fuchsia-500" : "bg-stone-700"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${manualMode ? "translate-x-4" : "translate-x-0"}`} /></span></button>
            </div>
            <div className="flex items-center justify-between border-t border-white/8 px-6 py-5 sm:px-8"><p className="text-[11px] text-stone-500"><strong className="font-semibold text-stone-300">{selectedModules.length}</strong> módulos selecionados</p><Button disabled={createMutation.isPending} type="submit" className="h-10 gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 text-white hover:from-rose-400 hover:to-fuchsia-500">{createMutation.isPending ? "Criando..." : "Criar estrutura"} <ArrowRight size={15} /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: typeof LayoutDashboard; label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-medium transition ${active ? "bg-white/8 text-rose-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" : "text-stone-500 hover:bg-white/4 hover:text-stone-200"}`}><Icon size={16} className={active ? "text-rose-300" : ""} />{label}</button>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div><p className="text-lg font-semibold tracking-tight text-stone-100">{value}</p><p className="mt-0.5 text-[11px] text-stone-500">{label}</p></div>;
}

function ProgressItem({ label, active = false }: { label: string; active?: boolean }) {
  return <div className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${active ? "border-rose-400/30 bg-rose-500/15 text-rose-300" : "border-white/10 text-stone-600"}`}>{active ? <Check size={11} /> : ""}</span><span className={active ? "text-xs text-stone-300" : "text-xs text-stone-500"}>{label}</span></div>;
}

function HomebrewCard({ homebrew, onClick, detailed = false, onDuplicate, onDelete }: { homebrew: (typeof demoHomebrews)[number]; onClick: () => void; detailed?: boolean; onDuplicate?: () => void; onDelete?: () => void }) {
  const visibility = homebrew.visibility === "private" ? "Privada" : homebrew.visibility === "public" ? "Pública" : "Não listada";
  return <button onClick={onClick} className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-[#18151f]/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-300/22 hover:bg-[#1d1925] ${detailed ? "min-h-[190px]" : ""}`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-rose-300/10 bg-rose-500/[0.03] transition group-hover:scale-110" /><div className="relative flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500/25 to-fuchsia-500/15 text-rose-200"><WandSparkles size={16} /></span><div className="flex items-center gap-1"><span className="rounded-md bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-stone-400">{visibility}</span>{detailed && <span className="flex gap-0.5"><span role="button" onClick={event => { event.stopPropagation(); onDuplicate?.(); }} className="grid h-6 w-6 place-items-center rounded-md text-stone-500 hover:bg-white/7 hover:text-rose-200" title="Duplicar"><Copy size={12} /></span><span role="button" onClick={event => { event.stopPropagation(); onDelete?.(); }} className="grid h-6 w-6 place-items-center rounded-md text-stone-500 hover:bg-rose-500/10 hover:text-rose-300" title="Excluir"><Trash2 size={12} /></span></span>}</div></div><h3 className="relative mt-5 line-clamp-2 text-sm font-semibold leading-snug text-stone-100">{homebrew.title}</h3><p className="relative mt-2 line-clamp-2 text-[11px] leading-relaxed text-stone-500">{homebrew.summary}</p><div className="relative mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-[10px] text-stone-500"><span>{formatDate(homebrew.updatedAt)}</span><span className="flex items-center gap-1 text-rose-300 opacity-0 transition group-hover:opacity-100">Abrir <ArrowRight size={12} /></span></div></button>;
}

function SectionHeader({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex gap-3"><span className="pt-0.5 text-[10px] font-bold tracking-[0.14em] text-rose-300">{number}</span><div><h3 className="text-sm font-semibold text-stone-100">{title}</h3><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{description}</p></div></div>;
}

function Field({ label, value, select = false }: { label: string; value: string; select?: boolean }) {
  return <div><Label className="text-xs font-medium text-stone-300">{label}</Label>{select ? <select defaultValue={value} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300 outline-none focus:border-rose-400/40"><option>{value}</option><option>Força</option><option>Destreza</option><option>Inteligência</option><option>Presença</option></select> : <Input defaultValue={value} className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-300" />}</div>;
}

function OptionalImagePanel({ imageUrl, onUrlChange, onLinkUrl, onUpload, onRemove }: { imageUrl: string; onUrlChange: (value: string) => void; onLinkUrl: () => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  return <div className="mt-5 rounded-xl border border-dashed border-white/12 bg-white/[0.018] p-4">
    <div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/6 text-rose-300"><ImagePlus size={16} /></span><div><p className="text-xs font-semibold text-stone-200">Imagem opcional</p><p className="mt-1 text-[10px] leading-relaxed text-stone-500">Use uma URL ou envie uma capa. Sem imagem, a ficha continua organizada sem espaços vazios.</p></div></div>
    <div className="mt-4 flex gap-2"><Input value={imageUrl.startsWith("data:") ? "Imagem enviada do dispositivo" : imageUrl} onChange={event => onUrlChange(event.target.value)} placeholder="https://.../capa.png" className="h-9 min-w-0 flex-1 border-white/8 bg-white/[0.035] text-[11px] placeholder:text-stone-600" /><button type="button" onClick={onLinkUrl} className="rounded-lg border border-white/9 px-3 text-[11px] font-semibold text-stone-300 hover:bg-white/6">Vincular</button></div>
    <label className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] text-[11px] font-medium text-stone-400 hover:bg-white/[0.05] hover:text-stone-200"><ImagePlus size={14} /> Enviar JPG, PNG ou WEBP <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onUpload} /></label>
    {imageUrl && <div className="relative mt-3 overflow-hidden rounded-lg border border-white/8 bg-black/10"><img src={imageUrl} alt="Prévia da capa da Homebrew" className="h-24 w-full object-cover" /><button type="button" onClick={onRemove} className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-500">Remover</button></div>}
  </div>;
}

function ManualNotes({ value, customFields, onChange, onFieldsChange }: { value: string; customFields: string[]; onChange: (value: string) => void; onFieldsChange: (fields: string[]) => void }) {
  const choices = ["Custo", "Alcance", "Duração", "Requisito", "Dano", "Efeito especial"];
  const toggle = (field: string) => onFieldsChange(customFields.includes(field) ? customFields.filter(item => item !== field) : [...customFields, field]);
  return <div className="rounded-2xl border border-fuchsia-400/18 bg-fuchsia-500/[0.055] p-5"><div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-fuchsia-500 text-white"><Feather size={15} /></span><div><p className="text-xs font-semibold text-fuchsia-100">Conteúdo personalizado</p><p className="mt-1 text-[11px] leading-relaxed text-stone-400">Marque os valores que fogem do modelo e descreva a exceção. A ficha compartilhável mostrará os campos personalizados.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{choices.map(field => <button key={field} type="button" onClick={() => toggle(field)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium ${customFields.includes(field) ? "border-fuchsia-300/35 bg-fuchsia-500/20 text-fuchsia-100" : "border-white/8 bg-black/10 text-stone-500 hover:text-stone-300"}`}>{customFields.includes(field) && <Check className="mr-1 inline" size={11} />}{field}</button>)}</div><textarea value={value} onChange={event => onChange(event.target.value)} placeholder="Ex.: Esta técnica usa uma condição especial definida para a campanha..." className="mt-4 min-h-28 w-full resize-none rounded-xl border border-fuchsia-300/15 bg-black/10 p-3 text-xs leading-relaxed text-stone-200 outline-none placeholder:text-stone-600 focus:border-fuchsia-300/35" /></div>;
}

function ValidationPanel({ items }: { items: ReturnType<typeof buildHomebrewValidation> }) {
  const invalid = items.filter(item => !item.valid);
  return <div className={`rounded-2xl border p-5 ${invalid.length ? "border-amber-400/15 bg-amber-400/[0.035]" : "border-emerald-400/15 bg-emerald-400/[0.04]"}`}><div className="flex items-start gap-3"><ShieldCheck size={17} className={`mt-0.5 ${invalid.length ? "text-amber-300" : "text-emerald-400"}`} /><div><p className="text-xs font-semibold text-stone-100">Validação contextual</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{invalid.length ? "Complete os itens abaixo antes de tratar este módulo como consistente." : "Os campos-base deste módulo estão consistentes para revisão do Narrador."}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{items.map(item => <div key={item.key} className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-[10px]"><span className={`grid h-4 w-4 place-items-center rounded-full ${item.valid ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{item.valid ? <Check size={10} /> : "!"}</span><span className={item.valid ? "text-stone-300" : "text-stone-400"}>{item.valid ? item.label : item.message}</span></div>)}</div></div>;
}

function ManualSwitch({ active, onChange }: { active: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!active)} className="flex items-center gap-2 text-[11px] font-medium text-stone-400 hover:text-stone-200"><span className={`h-4 w-7 rounded-full p-0.5 ${active ? "bg-fuchsia-500" : "bg-stone-700"}`}><span className={`block h-3 w-3 rounded-full bg-white transition ${active ? "translate-x-3" : ""}`} /></span> Modo manual</button>;
}

function TechniqueConfiguration({ manualMode, onManualMode, data, onData }: { manualMode: boolean; onManualMode: (value: boolean) => void; data: Record<string, unknown>; onData: React.Dispatch<React.SetStateAction<Record<string, unknown>>> }) {
  const level = Number(data.techniqueLevel ?? 2);
  const cost = Number(data.techniqueCost ?? SPELL_COST_BY_LEVEL[level as keyof typeof SPELL_COST_BY_LEVEL]);
  const update = (values: Record<string, unknown>) => onData(current => ({ ...current, ...values }));
  return <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5"><div className="flex items-start justify-between"><SectionHeader number="02" title="Feitiço de extensão" description="Aplique a técnica em uma forma prática, com tipo, nível e custo de energia." /><ManualSwitch active={manualMode} onChange={onManualMode} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><Label className="text-xs text-stone-300">Tipo <span className="text-rose-300">*</span></Label><select value={String(data.techniqueType ?? "dano")} onChange={event => update({ techniqueType: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300"><option value="dano">Feitiço de dano</option><option value="auxiliar">Feitiço auxiliar</option><option value="curativo">Feitiço curativo</option><option value="especial">Feitiço especial</option><option value="passivo">Feitiço passivo</option></select></div><div><Label className="text-xs text-stone-300">Nível <span className="text-rose-300">*</span></Label><select value={level} onChange={event => { const next = Number(event.target.value); update({ techniqueLevel: next, techniqueCost: SPELL_COST_BY_LEVEL[next as keyof typeof SPELL_COST_BY_LEVEL] }); }} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300">{[0, 1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></div><div><Label className="text-xs text-stone-300">Custo em PE <span className="text-rose-300">*</span></Label><Input type="number" min={0} value={cost} disabled={!manualMode} onChange={event => update({ techniqueCost: Number(event.target.value) })} className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-300 disabled:opacity-60" /></div></div><div className="mt-4 rounded-xl border border-rose-400/12 bg-rose-500/[0.04] p-3 text-[11px] leading-relaxed text-stone-400"><span className="font-semibold text-rose-200">Validação:</span> o custo padrão para nível {level} é {SPELL_COST_BY_LEVEL[level as keyof typeof SPELL_COST_BY_LEVEL]} PE. {manualMode ? "O valor pode ser alterado e será marcado como personalizado." : "Ative o modo manual para ajustar esse valor."}</div></div>;
}

function VowConfiguration({ manualMode, onManualMode, data, onData }: { manualMode: boolean; onManualMode: (value: boolean) => void; data: Record<string, unknown>; onData: React.Dispatch<React.SetStateAction<Record<string, unknown>>> }) {
  const duration = String(data.vowDuration ?? "permanente");
  const weight = String(data.vowWeight ?? "medio");
  const update = (values: Record<string, unknown>) => onData(current => ({ ...current, ...values }));
  const allowed = (duration === "temporario" && weight !== "extremo") || (duration === "permanente" && weight !== "leve");
  return <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5"><div className="flex items-start justify-between"><SectionHeader number="02" title="Contrapartida" description="Votos exigem uma limitação clara e uma recompensa coerente dentro do mesmo escopo." /><ManualSwitch active={manualMode} onChange={onManualMode} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><Label className="text-xs text-stone-300">Duração <span className="text-rose-300">*</span></Label><select value={duration} onChange={event => update({ vowDuration: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300"><option value="temporario">Temporário</option><option value="permanente">Permanente</option></select></div><div><Label className="text-xs text-stone-300">Peso <span className="text-rose-300">*</span></Label><select value={weight} onChange={event => update({ vowWeight: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300"><option value="leve">Leve</option><option value="medio">Médio</option><option value="pesado">Pesado</option><option value="extremo">Extremo</option></select></div><Field label="Ação" value="Ação bônus" select /></div><div className="mt-4"><Label className="text-xs text-stone-300">Malefício e benefício <span className="text-rose-300">*</span></Label><textarea value={String(data.vowTrade ?? "")} onChange={event => update({ vowTrade: event.target.value })} placeholder="Descreva o que se perde e o que se recebe com este voto." className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/8 bg-white/[0.035] p-3 text-xs leading-relaxed text-stone-300 outline-none focus:border-rose-400/35" /></div><div className={`mt-4 rounded-xl border p-3 text-[11px] leading-relaxed ${allowed ? "border-emerald-400/12 bg-emerald-400/[0.04] text-stone-400" : "border-amber-400/18 bg-amber-400/[0.05] text-stone-300"}`}><span className={`font-semibold ${allowed ? "text-emerald-200" : "text-amber-200"}`}>{allowed ? "Consistente:" : "Pendência:"}</span> {allowed ? "a combinação de duração e peso está dentro do intervalo permitido." : "votos temporários não podem ser extremos e votos permanentes não podem ser leves."}</div></div>;
}

function InvocationConfiguration() {
  return <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5"><SectionHeader number="02" title="Ficha de invocação" description="O grau determina custo, pontos de atributo, vida e defesa-base da invocação." /><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Tipo" value="Shikigami" select /><Field label="Grau" value="Quarto Grau" select /><Field label="Nível do usuário" value="4" /></div><div className="mt-5 grid grid-cols-4 gap-2"><RuleChip value="2 PE" label="Custo" /><RuleChip value="10" label="Pontos" /><RuleChip value="16" label="Limite" /><RuleChip value="20" label="Vida" /></div><div className="mt-4 rounded-xl border border-amber-400/12 bg-amber-400/[0.04] p-3 text-[11px] leading-relaxed text-stone-400"><span className="font-semibold text-amber-200">Cálculo guiado:</span> defesa, vida e limites são atualizados a partir do grau e dos atributos preenchidos.</div></div>;
}

function SpecificModuleConfiguration({ module, manualMode, onManualMode, data, onData }: { module: HomebrewModuleType; manualMode: boolean; onManualMode: (value: boolean) => void; data: Record<string, unknown>; onData: React.Dispatch<React.SetStateAction<Record<string, unknown>>> }) {
  const update = (values: Record<string, unknown>) => onData(current => ({ ...current, ...values }));
  const text = (key: string, fallback = "") => String(data[key] ?? fallback);
  const input = (key: string, label: string, placeholder: string, type: "text" | "number" = "text") => <div><Label className="text-xs font-medium text-stone-300">{label}</Label><Input type={type} value={text(key)} onChange={event => update({ [key]: type === "number" ? Number(event.target.value) : event.target.value })} placeholder={placeholder} className="mt-2 h-10 border-white/8 bg-white/[0.035] text-xs text-stone-300" /></div>;
  const select = (key: string, label: string, options: string[]) => <div><Label className="text-xs font-medium text-stone-300">{label}</Label><select value={text(key, options[0])} onChange={event => update({ [key]: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/8 bg-white/[0.035] px-3 text-xs text-stone-300 outline-none focus:border-rose-400/40">{options.map(option => <option key={option} value={option}>{option}</option>)}</select></div>;
  const moduleFields: Record<string, React.ReactNode> = {
    origem: <><div className="grid gap-4 sm:grid-cols-3">{input("originName", "Nome da origem", "Ex.: Clã, escola ou linhagem")}{select("originType", "Tipo", ["Clã", "Escola", "Linhagem", "Organização", "Personalizada"])}{select("originAttribute", "Atributo de foco", ["Força", "Destreza", "Intelecto", "Presença", "Nenhum"])} </div><div className="mt-4 grid gap-4 sm:grid-cols-2">{input("originBenefit", "Benefício inicial", "Vantagem estruturada da origem")}{input("originRestriction", "Restrição", "Limite ou condição da origem")}</div></>,
    armas: <><div className="grid gap-4 sm:grid-cols-4">{select("weaponCategory", "Categoria", ["Leve", "Pesada", "Distância", "Especial"])}{select("weaponHands", "Empunhadura", ["Uma mão", "Duas mãos", "Livre"])}{input("weaponDamage", "Dano base", "Ex.: 1d8")}{input("weaponRange", "Alcance", "Ex.: 10 metros")}</div><div className="mt-4 grid gap-4 sm:grid-cols-2">{input("weaponProperty", "Propriedade", "Ex.: precisa, alcance, versátil")}{input("weaponRequirement", "Requisito", "Atributo ou condição para usar")}</div></>,
    mecanicas: <><div className="grid gap-4 sm:grid-cols-3">{select("mechanicCategory", "Categoria", ["Ação", "Reação", "Recurso", "Condição", "Passiva"])}{input("mechanicTrigger", "Gatilho", "Quando esta mecânica acontece")}{input("mechanicResource", "Recurso", "PE, vida, rodada ou outro")}</div><div className="mt-4">{input("mechanicFormula", "Fórmula ou limite", "Ex.: PE = nível + atributo")}</div></>,
    aptidoes: <><div className="grid gap-4 sm:grid-cols-3">{select("aptitudeCategory", "Categoria", ["Combate", "Perícia", "Resistência", "Social", "Sobrenatural"])}{select("aptitudeAttribute", "Atributo associado", ["Força", "Destreza", "Intelecto", "Presença", "Nenhum"])}{input("aptitudePrerequisite", "Pré-requisito", "Nível, atributo ou elemento")}</div><div className="mt-4">{input("aptitudeEffect", "Efeito", "Benefício mecânico da aptidão")}</div></>,
    especializacoes: <><div className="grid gap-4 sm:grid-cols-3">{input("specializationField", "Área", "Campo de especialização")}{select("specializationRank", "Grau", ["Iniciante", "Treinado", "Especialista", "Mestre"])}{input("specializationPrerequisite", "Pré-requisito", "Condição para adquirir")}</div><div className="mt-4">{input("specializationEffect", "Efeito", "Benefício mecânico da especialização")}</div></>,
  };
  return <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5"><div className="flex items-start justify-between"><SectionHeader number="02" title={`Configuração de ${HOME_BREW_MODULE_LABELS[module]}`} description="Campos específicos do módulo, separados do texto narrativo e preservando exceções manuais." /><ManualSwitch active={manualMode} onChange={onManualMode} /></div><div className="mt-5">{moduleFields[module] ?? <div className="rounded-xl border border-dashed border-white/8 p-4 text-xs text-stone-500">Este módulo usa o painel estruturado para seus campos específicos.</div>}</div><div className="mt-5"><Label className="text-xs font-medium text-stone-300">Notas e interações</Label><textarea value={text(`${module}Notes`)} onChange={event => update({ [`${module}Notes`]: event.target.value })} placeholder="Descreva interações com outros elementos sem misturar os campos estruturados." className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/8 bg-white/[0.035] p-3 text-xs leading-relaxed text-stone-300 outline-none focus:border-rose-400/35" /></div></div>;
}

function GenericConfiguration({ module, manualMode, onManualMode }: { module: HomebrewModuleType; manualMode: boolean; onManualMode: (value: boolean) => void }) {
  return <div className="rounded-2xl border border-white/8 bg-[#17141f]/80 p-5"><div className="flex items-start justify-between"><SectionHeader number="02" title="Detalhes estruturados" description="Organize os campos que definem como este elemento funciona na ficha." /><ManualSwitch active={manualMode} onChange={onManualMode} /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nome de referência" value={HOME_BREW_MODULE_LABELS[module]} /><Field label="Origem dos dados" value={manualMode ? "Personalizado" : "Livro de regras"} select /></div><div className="mt-4"><Label className="text-xs text-stone-300">Efeito, limite ou progressão</Label><textarea defaultValue="Registre o funcionamento, os pré-requisitos e as interações relevantes para este componente." className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/8 bg-white/[0.035] p-3 text-xs leading-relaxed text-stone-300 outline-none focus:border-rose-400/35" /></div></div>;
}

function RuleChip({ value, label }: { value: string; label: string }) { return <div className="rounded-xl border border-white/7 bg-white/[0.025] px-2 py-3 text-center"><p className="text-sm font-semibold text-rose-200">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wide text-stone-500">{label}</p></div>; }
