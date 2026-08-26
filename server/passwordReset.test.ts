import { describe, expect, it } from "vitest";
import { buildPasswordResetUrl, getSmtpConfig } from "./mail";

describe("recuperação de senha", () => {
  it("gera um link absoluto com token codificado", () => {
    const url = buildPasswordResetUrl("token com espaço", "https://feiticeiros-homebrew.vercel.app/");
    expect(url).toBe("https://feiticeiros-homebrew.vercel.app/login?reset=token+com+espa%C3%A7o");
  });

  it("aceita uma configuração SMTP completa sem expor valores", () => {
    expect(getSmtpConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "mailer",
      SMTP_PASSWORD: "secret",
      SMTP_FROM: "Homebrew Forge <no-reply@example.com>",
    })).toMatchObject({ host: "smtp.example.com", port: 587, secure: false });
  });

  it("rejeita configuração SMTP incompleta", () => {
    expect(() => getSmtpConfig({ SMTP_HOST: "smtp.example.com" })).toThrow("SMTP não configurado");
  });
});
