// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { ShikigamiConfiguration } from "./ShikigamiConfiguration";

function Harness() {
  const [data, setData] = useState<Record<string, unknown>>({ shikigami: { grade: "quarto", attributes: {} } });
  const [manual, setManual] = useState(false);
  return <ShikigamiConfiguration manualMode={manual} onManualMode={setManual} data={data} onData={setData} />;
}

describe("ShikigamiConfiguration", () => {
  it("organiza a ficha nos blocos do PDF e persiste escolhas estruturadas", () => {
    render(<Harness />);
    expect(screen.getByText("Estado da invocação")).toBeTruthy();
    expect(screen.getByText("Informações")).toBeTruthy();
    expect(screen.getByText("Atributos")).toBeTruthy();
    expect(screen.getByText("Perícias")).toBeTruthy();
    expect(screen.getByText("Habilidades de Controlador")).toBeTruthy();
    expect(screen.getByText("Características do Shikigami")).toBeTruthy();
    expect(screen.getAllByText("Sabedoria").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carisma").length).toBeGreaterThan(0);
    expect(screen.getByText("0/10")).toBeTruthy();
    expect(screen.getAllByText("Modificador: -1")).toHaveLength(6);
    expect(screen.getByText("Bônus em Perícia C")).toBeTruthy();
    expect(screen.getAllByText("0/10 vagas da planilha")).toHaveLength(2);
    expect(screen.getByRole("progressbar", { name: "Estado da invocação: 100%" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Grau Especial" })).toBeTruthy();
    expect(screen.getByText("Melhoria de Controlador: Resistência")).toBeTruthy();
    expect(screen.getByText("Melhoria de Controlador: Mobilidade")).toBeTruthy();
    expect(screen.getByText("Melhoria de Controlador: Precisão (CD)")).toBeTruthy();

    const controllerToggle = screen.getByLabelText(/Concentrar Poder/);
    expect((controllerToggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(controllerToggle);
    expect((controllerToggle as HTMLInputElement).checked).toBe(true);

    const thirdSkillBonus = screen.getByLabelText(/Bônus em Perícia C/);
    fireEvent.click(thirdSkillBonus);
    expect((thirdSkillBonus as HTMLInputElement).checked).toBe(true);
  });
});
