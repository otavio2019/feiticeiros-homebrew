// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  calls: new Map<string, unknown[]>(),
  elementRefetch: vi.fn(),
  mechanicsRefetch: vi.fn(),
  linksRefetch: vi.fn(),
  elements: [
    { id: 1, name: "Eco Sombrio", description: "Primeira técnica", type: "tecnica", imageUrl: null },
    { id: 2, name: "Vazio Cortante", description: "Segunda técnica", type: "tecnica", imageUrl: null },
  ],
  allElements: [
    { id: 1, name: "Eco Sombrio", description: "Primeira técnica", type: "tecnica", imageUrl: null },
    { id: 2, name: "Vazio Cortante", description: "Segunda técnica", type: "tecnica", imageUrl: null },
  ],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => {
  const record = (name: string, input: unknown) => {
    const previous = mocks.calls.get(name) ?? [];
    previous.push(input);
    mocks.calls.set(name, previous);
  };
  const mutation = (name: string, options?: { onSuccess?: (value?: unknown) => void }) => ({
    isPending: false,
    mutate: (input: unknown) => {
      record(name, input);
      options?.onSuccess?.(name === "structuredCreate" ? { id: 3 } : undefined);
    },
  });
  return {
    trpc: {
      homebrew: {
        structuredList: {
          useQuery: (input: { moduleId?: number }) => ({
            data: input.moduleId ? mocks.elements : mocks.allElements,
            refetch: mocks.elementRefetch,
          }),
        },
        structuredMechanics: {
          useQuery: () => ({
            data: { requirements: [], attributeBonuses: [], effects: [], costs: [], damageProfiles: [], ranges: [], conditions: [], vowExchanges: [], evolutions: [] },
            refetch: mocks.mechanicsRefetch,
          }),
        },
        structuredEvolutionUnlocks: { useQuery: () => ({ data: [], refetch: mocks.mechanicsRefetch }) },
        structuredWeaponTechniqueLinks: { useQuery: () => ({ data: [], refetch: mocks.linksRefetch }) },
        uploadImage: { useMutation: (options: any) => mutation("uploadImage", options) },
        addImageUrl: { useMutation: (options: any) => mutation("addImageUrl", options) },
        structuredCreate: { useMutation: (options: any) => mutation("structuredCreate", options) },
        structuredUpdate: { useMutation: (options: any) => mutation("structuredUpdate", options) },
        structuredDelete: { useMutation: (options: any) => mutation("structuredDelete", options) },
        removeImage: { useMutation: (options: any) => mutation("removeImage", options) },
        structuredWeaponTechniqueLinkCreate: { useMutation: (options: any) => mutation("linkCreate", options) },
        structuredWeaponTechniqueLinkDelete: { useMutation: (options: any) => mutation("linkDelete", options) },
        structuredWeaponTechniqueLinkUpdate: { useMutation: (options: any) => mutation("linkUpdate", options) },
        structuredReorder: { useMutation: (options: any) => mutation("structuredReorder", options) },
        structuredSaveMechanics: { useMutation: (options: any) => mutation("structuredSaveMechanics", options) },
        structuredSaveExtendedMechanics: { useMutation: (options: any) => mutation("structuredSaveExtendedMechanics", options) },
        structuredEvolutionUnlocksReplace: { useMutation: (options: any) => mutation("structuredEvolutionUnlocksReplace", options) },
      },
    },
  };
});

vi.mock("@/components/StructuredChildList", () => ({ StructuredChildList: () => null }));

import { StructuredElementsPanel } from "./Home";

describe("StructuredElementsPanel", () => {
  afterEach(() => {
    cleanup();
    mocks.calls.clear();
    vi.clearAllMocks();
  });

  it("executa criação, edição, exclusão e reordenação pelo editor real", async () => {
    const user = userEvent.setup();
    render(<StructuredElementsPanel homebrewId={55} moduleId={7} moduleType="tecnicas" />);

    await user.type(screen.getByPlaceholderText("Técnica ou feitiço"), "Nova Técnica");
    await user.type(screen.getByPlaceholderText("Descrição e funcionamento"), "Descrição nova");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));
    expect(mocks.calls.get("structuredCreate")).toEqual([
      { homebrewId: 55, moduleId: 7, type: "tecnica", name: "Nova Técnica", description: "Descrição nova", ruleSource: "homebrew", isManual: false },
    ]);

    await user.click(screen.getByRole("button", { name: "Editar Eco Sombrio" }));
    const editInputs = screen.getAllByDisplayValue(/Primeira técnica|Eco Sombrio/);
    await user.clear(editInputs[0]);
    await user.type(editInputs[0], "Eco Atualizado");
    await user.click(screen.getByRole("button", { name: /^Salvar$/ }));
    expect(mocks.calls.get("structuredUpdate")).toEqual([
      { homebrewId: 55, id: 1, name: "Eco Atualizado", description: "Primeira técnica" },
    ]);

    await user.click(screen.getByRole("button", { name: "Mover Eco Sombrio para baixo" }));
    expect(mocks.calls.get("structuredReorder")).toEqual([{ homebrewId: 55, id: 1, direction: "down" }]);

    await user.click(screen.getByRole("button", { name: "Excluir Vazio Cortante" }));
    expect(mocks.calls.get("structuredDelete")).toEqual([{ homebrewId: 55, id: 2 }]);
  });

  it("salva uma perda de Voto como troca estruturada", async () => {
    const user = userEvent.setup();
    render(<StructuredElementsPanel homebrewId={55} moduleId={7} moduleType="votos" />);

    await user.selectOptions(screen.getByLabelText("Tipo de troca do Voto"), "loss");
    await user.type(screen.getByPlaceholderText("Descrição do ganho ou da perda"), "Não pode recuar");
    await user.type(screen.getByPlaceholderText("Valor opcional"), "3");
    await user.click(screen.getAllByRole("button", { name: "Adicionar" })[1]);

    expect(mocks.calls.get("structuredSaveExtendedMechanics")).toEqual([
      { homebrewId: 55, elementId: 1, vowExchanges: [{ kind: "loss", description: "Não pode recuar", valueNumber: 3 }] },
    ]);
  });
});
