import { describe, expect, it } from "vitest";
import { isCurrentHomebrewDetail } from "./Home";

describe("troca de Homebrew ativa", () => {
  it("aceita detalhes apenas quando pertencem ao ID atualmente selecionado", () => {
    expect(isCurrentHomebrewDetail({ id: 42 }, 42)).toBe(true);
    expect(isCurrentHomebrewDetail({ id: 12 }, 42)).toBe(false);
    expect(isCurrentHomebrewDetail(undefined, 42)).toBe(false);
    expect(isCurrentHomebrewDetail({ id: 42 }, null)).toBe(false);
  });
});
