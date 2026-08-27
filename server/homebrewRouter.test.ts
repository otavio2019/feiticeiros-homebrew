import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listHomebrewsForUser: vi.fn(),
  getHomebrewById: vi.fn(),
  getHomebrewDetail: vi.fn(),
  getShareableHomebrew: vi.fn(),
  createHomebrew: vi.fn(),
  updateHomebrew: vi.fn(),
  deleteHomebrew: vi.fn(),
  duplicateHomebrew: vi.fn(),
  addModule: vi.fn(),
  addHomebrewImage: vi.fn(),
  removeHomebrewImage: vi.fn(),
  listStructuredElements: vi.fn(),
  listStructuredElementsForShare: vi.fn(),
  updateStructuredElement: vi.fn(),
  reorderStructuredElement: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ownHomebrew = {
  id: 7,
  ownerId: 1,
  title: "Jardim de Teste",
  summary: "Uma Homebrew para validar os fluxos de dados.",
  shareId: "compartilhar-7",
  visibility: "unlisted" as const,
  status: "draft" as const,
  characterLevel: 1,
  manualMode: false,
  coverImageUrl: null,
  data: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "homebrew-test-user",
      name: "Teste",
      email: "teste@example.com",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("fluxos de dados da biblioteca de Homebrews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getHomebrewById).mockResolvedValue(ownHomebrew);
  });

  it("lista Homebrews do proprietário", async () => {
    vi.mocked(db.listHomebrewsForUser).mockResolvedValue([ownHomebrew]);
    const result = await appRouter.createCaller(createContext()).homebrew.list({ search: "Jardim" });
    expect(result).toEqual([ownHomebrew]);
    expect(db.listHomebrewsForUser).toHaveBeenCalledWith(1, "Jardim");
  });

  it("cria uma estrutura com módulos escolhidos", async () => {
    vi.mocked(db.createHomebrew).mockResolvedValue({ ...ownHomebrew, modules: [] } as never);
    await appRouter.createCaller(createContext()).homebrew.create({
      title: "Ritual de Teste",
      summary: "Estrutura modular.",
      visibility: "private",
      manualMode: false,
      modules: ["origem", "tecnicas"],
    });
    expect(db.createHomebrew).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 1,
      title: "Ritual de Teste",
      modules: ["origem", "tecnicas"],
    }));
  });

  it("edita, duplica e exclui apenas a Homebrew do proprietário", async () => {
    vi.mocked(db.updateHomebrew).mockResolvedValue({ ...ownHomebrew, title: "Atualizada" } as never);
    vi.mocked(db.duplicateHomebrew).mockResolvedValue({ ...ownHomebrew, id: 8 } as never);
    const caller = appRouter.createCaller(createContext());
    await caller.homebrew.update({ id: 7, title: "Atualizada" });
    await caller.homebrew.duplicate({ id: 7 });
    await caller.homebrew.remove({ id: 7 });
    expect(db.updateHomebrew).toHaveBeenCalledWith(7, { title: "Atualizada" });
    expect(db.duplicateHomebrew).toHaveBeenCalledWith(ownHomebrew, 1, expect.any(String));
    expect(db.deleteHomebrew).toHaveBeenCalledWith(7);
  });

  it("edita e reordena elementos estruturados do proprietário", async () => {
    vi.mocked(db.updateStructuredElement).mockResolvedValue({ id: 11, name: "Atualizado" } as never);
    vi.mocked(db.reorderStructuredElement).mockResolvedValue({ id: 11, position: 1 } as never);
    const caller = appRouter.createCaller(createContext());
    await caller.homebrew.structuredUpdate({ homebrewId: 7, id: 11, name: "Atualizado" });
    await caller.homebrew.structuredReorder({ homebrewId: 7, id: 11, direction: "down" });
    expect(db.updateStructuredElement).toHaveBeenCalledWith(11, { name: "Atualizado" });
    expect(db.reorderStructuredElement).toHaveBeenCalledWith(11, "down");
  });

  it("entrega uma Homebrew não privada na leitura compartilhável", async () => {
    const detail = { ...ownHomebrew, modules: [], elements: [], images: [] };
    vi.mocked(db.getShareableHomebrew).mockResolvedValue(ownHomebrew);
    vi.mocked(db.getHomebrewDetail).mockResolvedValue(detail as never);
    const structured = [{ id: 11, type: "tecnica", name: "Eco", description: "Devolve energia.", isManual: true, ruleSource: "manual", mechanics: { requirements: [], attributeBonuses: [{ attribute: "sabedoria", value: 2 }], effects: [], costs: [], damageProfiles: [], ranges: [], conditions: [], vowExchanges: [], evolutions: [] } }];
    vi.mocked(db.listStructuredElementsForShare).mockResolvedValue(structured as never);
    const result = await appRouter.createCaller(createContext()).homebrew.shared({ shareId: "compartilhar-7" });
    expect(result).toEqual({ ...detail, structured });
    expect(db.getShareableHomebrew).toHaveBeenCalledWith("compartilhar-7");
  });
});
