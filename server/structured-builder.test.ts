import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("structured builder migration", () => {
  const migration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0003_useful_blackheart.sql"), "utf8");

  it("declares every structured entity table", () => {
    for (const table of ["homebrewStructuredElements", "structuredAttributeBonuses", "structuredRequirements", "structuredEffects", "structuredCosts", "structuredDamageProfiles", "structuredRanges", "structuredConditions", "structuredVowExchanges", "structuredEvolutions", "structuredWeaponTechniqueLinks"]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS \`${table}\``);
    }
  });

  it("does not use DEFAULT on TEXT columns", () => {
    expect(migration).not.toMatch(/text\([^\n]+\)\s+NOT NULL\s+DEFAULT/i);
  });

  it("does not contain long or replay-prone foreign-key ALTER statements", () => {
    expect(migration).not.toMatch(/CONSTRAINT `[^`]{65,}`/);
    expect(migration).not.toMatch(/^ALTER TABLE .* ADD CONSTRAINT /m);
  });
});
