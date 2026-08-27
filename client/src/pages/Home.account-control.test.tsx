// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControl } from "./Home";

describe("AccountControl", () => {
  afterEach(cleanup);

  it("expõe logout acessível para uma sessão autenticada", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<AccountControl user={{ name: "Validação Vercel" }} loading={false} onLogin={vi.fn()} onLogout={onLogout} />);

    expect(screen.getByText("Validação Vercel")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("direciona visitantes para a entrada", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<AccountControl user={null} loading={false} onLogin={onLogin} onLogout={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Entrar para salvar" }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
