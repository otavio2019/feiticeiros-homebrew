import { describe, expect, it } from "vitest";
import { buildShareUrl, isCurrentHomebrewDetail, isShareableVisibility, normalizeHomebrewVisibility } from "./Home";

describe("troca de Homebrew ativa", () => {
  it("aceita detalhes apenas quando pertencem ao ID atualmente selecionado", () => {
    expect(isCurrentHomebrewDetail({ id: 42 }, 42)).toBe(true);
    expect(isCurrentHomebrewDetail({ id: 12 }, 42)).toBe(false);
    expect(isCurrentHomebrewDetail(undefined, 42)).toBe(false);
    expect(isCurrentHomebrewDetail({ id: 42 }, null)).toBe(false);
  });

  it("libera link apenas para Homebrews não listadas ou públicas", () => {
    expect(isShareableVisibility("private")).toBe(false);
    expect(isShareableVisibility("unlisted")).toBe(true);
    expect(isShareableVisibility("public")).toBe(true);
    expect(buildShareUrl("https://feiticeiros-homebrew.vercel.app", "lacre-arcano")).toBe("https://feiticeiros-homebrew.vercel.app/s/lacre-arcano");
    expect(normalizeHomebrewVisibility("public")).toBe("public");
    expect(normalizeHomebrewVisibility("valor inválido")).toBe("private");
  });
});
