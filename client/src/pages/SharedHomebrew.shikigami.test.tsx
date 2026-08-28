// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ShikigamiReadCard } from "./SharedHomebrew";

describe("ShikigamiReadCard", () => {
  it("recalcula a ficha compartilhada com o tipo, estado e escolhas da planilha Google", () => {
    render(<ShikigamiReadCard sheet={{
      name: "Corvo de Selos",
      grade: "terceiro",
      type: "tecnica",
      userLevel: 8,
      mastery: 3,
      attributes: { forca: 10, destreza: 12, constituicao: 10, inteligencia: 14, sabedoria: 10, carisma: 10 },
      lostHealth: 5,
      controllerOptions: { invocacoesEconomicas: true, melhoriaResistencia: true },
      traits: { tamanho: true, bonusPericiaA: true, bonusPericiaC: true },
      size: "grande",
      bonusSkillA: "feiticaria",
      bonusSkillC: "ocultismo",
      skills: { feiticaria: { otherBonus: 2, mastery: true }, ocultismo: { specialty: true } },
      abilities: [{ id: "ac-1", kind: "acao", name: "Selo Cortante", description: "Um ataque de selo amaldiçoado." }],
    }} />);

    expect(screen.getByText("Corvo de Selos")).toBeTruthy();
    expect(screen.getByText(/Shikigami de Técnica/)).toBeTruthy();
    expect(screen.getByText("3 PE")).toBeTruthy();
    expect(screen.getByText("21")).toBeTruthy();
    expect(screen.getByText(/Tamanho: ataques \+2; resistências -2/)).toBeTruthy();
    expect(screen.getByText("Selo Cortante")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Estado da invocação: 88%" })).toBeTruthy();
    expect(screen.getByText("Perícias calculadas")).toBeTruthy();
    expect(screen.getAllByText("Feitiçaria").length).toBeGreaterThan(0);
    expect(screen.getByText("Bônus em Perícia C")).toBeTruthy();
  });

  it("mantém os rótulos literais de Grau Especial e das melhorias do controlador", () => {
    const view = render(<ShikigamiReadCard sheet={{
      name: "Guardião Especial",
      grade: "especial",
      type: "comum",
      userLevel: 1,
      attributes: {},
      controllerOptions: { melhoriaResistencia: true, melhoriaMobilidade: true, melhoriaPrecisao: true },
      traits: {},
      skills: {},
      abilities: [],
    }} />);

    expect(view.getByText(/Grau Especial/)).toBeTruthy();
    expect(view.getAllByText("Melhoria de Controlador: Resistência").length).toBeGreaterThan(0);
    expect(view.getAllByText("Melhoria de Controlador: Mobilidade").length).toBeGreaterThan(0);
    expect(view.getAllByText("Melhoria de Controlador: Precisão (CD)").length).toBeGreaterThan(0);
  });
});
