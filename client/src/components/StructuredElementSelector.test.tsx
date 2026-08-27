// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StructuredElementSelector } from "./StructuredElementSelector";

describe("StructuredElementSelector", () => {
  it("troca o alvo para qualquer elemento da lista", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StructuredElementSelector elements={[{ id: 11, name: "Eco" }, { id: 12, name: "Arma Sombria" }, { id: 13, name: "Voto" }]} value={11} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Elemento estruturado selecionado" }), "13");

    expect(onChange).toHaveBeenCalledWith(13);
  });
});
