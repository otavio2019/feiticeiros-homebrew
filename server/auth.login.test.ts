import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createLocalUser: vi.fn(),
}));
const sdkMock = vi.hoisted(() => ({
  createSession: vi.fn(),
  destroySession: vi.fn(),
  readSessionToken: vi.fn(),
  hashToken: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./_core/sdk", () => ({ ...sdkMock, sdk: sdkMock }));

import { hashPassword } from "./_core/password";
import { appRouter } from "./routers";

const baseUser = {
  id: 1,
  openId: "local-user",
  name: "Otávio",
  email: "otavioaugusto0172@gmail.com",
  normalizedEmail: "otavioaugusto0172@gmail.com",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies,
    ctx: {
      user: null,
      req: { protocol: "https", headers: { "x-forwarded-proto": "https" } },
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) },
    } as any,
  };
}

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdkMock.createSession.mockResolvedValue("session-token");
  });

  it("orienta contas Google sem passwordHash para a recuperação local", async () => {
    dbMock.getUserByEmail.mockResolvedValue({ ...baseUser, loginMethod: "google", passwordHash: null });
    const { ctx } = createContext();

    await expect(appRouter.createCaller(ctx).auth.login({ email: baseUser.email, password: "senha-invalida" })).rejects.toThrow(
      "Esta conta foi criada via Google. Use 'Esqueci minha senha' para definir uma senha local.",
    );
    expect(sdkMock.createSession).not.toHaveBeenCalled();
  });

  it("emite cookie HTTPS depois de validar uma senha local", async () => {
    dbMock.getUserByEmail.mockResolvedValue({ ...baseUser, loginMethod: "password", passwordHash: await hashPassword("senha-segura-123") });
    const { ctx, cookies } = createContext();

    await appRouter.createCaller(ctx).auth.login({ email: baseUser.email, password: "senha-segura-123" });

    expect(sdkMock.createSession).toHaveBeenCalledWith(baseUser.id);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({ name: "app_session_id", value: "session-token", options: { httpOnly: true, secure: true, sameSite: "lax", path: "/" } });
  });
});

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna conflito compreensível quando o e-mail já existe", async () => {
    dbMock.getUserByEmail.mockResolvedValue(baseUser);
    const { ctx } = createContext();

    await expect(
      appRouter.createCaller(ctx).auth.register({ email: baseUser.email, password: "senha-segura-123", name: "Otávio" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Este e-mail já está cadastrado. Entre com sua senha ou use a recuperação de senha.",
    });
    expect(dbMock.createLocalUser).not.toHaveBeenCalled();
  });
});
