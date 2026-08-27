import React from "react";

type StructuredElementOption = { id: number; name: string };

type StructuredElementSelectorProps = {
  elements: StructuredElementOption[];
  value: number;
  onChange: (id: number) => void;
};

export function StructuredElementSelector({ elements, value, onChange }: StructuredElementSelectorProps) {
  return (
    <select
      aria-label="Elemento estruturado selecionado"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-8 rounded-md border border-white/8 bg-[#201b29] px-2 text-xs text-stone-300"
    >
      {elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}
    </select>
  );
}
