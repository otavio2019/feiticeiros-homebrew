type StructuredChildListProps = {
  title: string;
  items: unknown[];
  label: (item: unknown) => string;
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  reorderable?: boolean;
};

export function StructuredChildList({ title, items, label, onRemove, onEdit = () => undefined, onMove, reorderable = true }: StructuredChildListProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-white/6 bg-black/10 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">{title}</p>
      <div className="mt-2 space-y-1">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-center gap-2 rounded-md border border-white/5 px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-[10px] text-stone-400">{label(item)}</span>
            <button type="button" aria-label={`Editar item ${index + 1}`} onClick={() => onEdit(index)} className="text-stone-500 hover:text-fuchsia-200">✎</button>
            {reorderable && <><button type="button" aria-label={`Mover item ${index + 1} para cima`} disabled={index === 0} onClick={() => onMove(index, "up")} className="text-stone-500 hover:text-stone-200 disabled:opacity-25">↑</button>
            <button type="button" aria-label={`Mover item ${index + 1} para baixo`} disabled={index === items.length - 1} onClick={() => onMove(index, "down")} className="text-stone-500 hover:text-stone-200 disabled:opacity-25">↓</button></>}
            <button type="button" aria-label={`Remover item ${index + 1}`} onClick={() => onRemove(index)} className="text-stone-500 hover:text-rose-300">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
