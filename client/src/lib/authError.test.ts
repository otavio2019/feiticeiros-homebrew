import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./authError";

describe("getAuthErrorMessage", () => {
  it("mantém mensagens de login e recuperação de solicitação", () => {
    expect(getAuthErrorMessage(new Error("Credenciais inválidas."), "login")).toBe("Credenciais inválidas.");
    expect(getAuthErrorMessage(new Error("SMTP indisponível."), "request")).toBe("SMTP indisponível.");
  });

  it("não expõe detalhes de validação no fluxo de redefinição", () => {
    expect(getAuthErrorMessage(new Error('[{"code":"too_small"}]'), "reset")).toBe(
      "O link de recuperação é inválido ou expirou. Solicite um novo link.",
    );
  });
});
