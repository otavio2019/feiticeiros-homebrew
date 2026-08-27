// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ calls: new Map<string, unknown[]>(), refetch: vi.fn() }));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => {
  const mutation = (name: string, options?: { onSuccess?: () => void }) => ({
    isPending: false,
    mutate: (input: unknown) => {
      const previous = mocks.calls.get(name) ?? [];
      previous.push(input);
      mocks.calls.set(name, previous);
      options?.onSuccess?.();
    },
  });
  return {
    trpc: {
      homebrew: {
        structuredList: { useQuery: () => ({ data: [], refetch: mocks.refetch }) },
        structuredMechanics: { useQuery: () => ({ data: { requirements: [], attributeBonuses: [], effects: [] }, refetch: mocks.refetch }) },
        structuredCreate: { useMutation: (options: any) => mutation("structuredCreate", options) },
        structuredUpdate: { useMutation: (options: any) => mutation("structuredUpdate", options) },
        structuredDelete: { useMutation: (options: any) => mutation("structuredDelete", options) },
        structuredReorder: { useMutation: (options: any) => mutation("structuredReorder", options) },
        structuredSaveMechanics: { useMutation: (options: any) => mutation("structuredSaveMechanics", options) },
      },
    },
  };
});

import { StructuredElementChildren } from "./StructuredElementChildren";

describe("StructuredElementChildren", () => {
  afterEach(() => {
    cleanup();
    mocks.calls.clear();
    vi.clearAllMocks();
  });

  it("cria uma Característica vinculada à Origem selecionada", async () => {
    const user = userEvent.setup();
    render(<StructuredElementChildren homebrewId={55} moduleId={7} moduleType="origem" parentElementId={9} />);

    await user.type(screen.getByPlaceholderText("Nome da característica"), "Olhar Amaldiçoado");
    await user.type(screen.getByPlaceholderText("Traços e efeitos próprios da origem."), "Percebe energia residual.");
    await user.click(screen.getByRole("button", { name: /Adicionar/ }));

    expect(mocks.calls.get("structuredCreate")).toEqual([
      { homebrewId: 55, moduleId: 7, parentElementId: 9, type: "caracteristica", name: "Olhar Amaldiçoado", description: "Percebe energia residual.", ruleSource: "homebrew", isManual: false },
    ]);
  });
});
