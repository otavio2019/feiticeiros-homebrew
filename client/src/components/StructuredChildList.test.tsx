// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StructuredChildList } from "./StructuredChildList";

describe("StructuredChildList", () => {
  afterEach(() => cleanup());
  it("dispara edição, remoção e movimento do item selecionado", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    const onMove = vi.fn();
    render(
      <StructuredChildList
        title="Requisitos"
        items={[{ text: "Atributo" }, { text: "Nível" }]}
        label={(item) => (item as { text: string }).text}
        onEdit={onEdit}
        onRemove={onRemove}
        onMove={onMove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editar item 2" }));
    await user.click(screen.getByRole("button", { name: "Mover item 2 para cima" }));
    await user.click(screen.getByRole("button", { name: "Remover item 1" }));

    expect(onEdit).toHaveBeenCalledWith(1);
    expect(onMove).toHaveBeenCalledWith(1, "up");
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("não exibe controles de movimento quando a coleção não persiste posição", () => {
    render(
      <StructuredChildList
        title="Bônus"
        items={[{ text: "Força" }]}
        label={(item) => (item as { text: string }).text}
        onRemove={vi.fn()}
        onMove={vi.fn()}
        reorderable={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /Mover item/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Editar item 1" })).toBeTruthy();
  });
});
