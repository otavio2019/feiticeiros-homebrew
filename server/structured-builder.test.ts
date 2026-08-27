import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("structured builder migration", () => {
  const migration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0003_useful_blackheart.sql"), "utf8");
  const hierarchyMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0004_structured_hierarchy_and_categories.sql"), "utf8");

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

  it("adiciona a hierarquia e categorias filhas na migration versionada", () => {
    expect(hierarchyMigration).toContain("parentElementId");
    expect(hierarchyMigration).toContain("structured_parent_fk");
    for (const type of ["caracteristica", "talento", "evolucao", "propriedade"]) expect(hierarchyMigration).toContain(`'${type}'`);
  });

  it("usa formulário completo para editar coleções filhas", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).not.toContain("window.prompt");
    expect(source).toContain("childEditorFields");
    expect(source).toContain("Salvar item");
    expect(source).toContain("structuredWeaponTechniqueLinkUpdate");
    expect(source).toContain("SpecificModuleConfiguration");
    for (const field of ["originName", "weaponDamage", "mechanicFormula", "aptitudeEffect", "specializationEffect"]) {
      expect(source).toContain(field);
    }
  });

  it("mantém o remapeamento da duplicação estruturada no código do banco", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(source).toContain("duplicateStructuredEntities");
    expect(source).toContain("const structuredElementMap = new Map");
    expect(source).toContain("legacyElementMap.get(element.legacyElementId)");
    for (const table of ["structuredAttributeBonuses", "structuredRequirements", "structuredEffects", "structuredCosts", "structuredDamageProfiles", "structuredRanges", "structuredConditions", "structuredVowExchanges", "structuredEvolutions", "structuredWeaponTechniqueLinks"]) {
      expect(source).toContain(`database.insert(${table})`);
    }
    expect(source).toContain("structuredElementMap.get(image.elementId)");
    expect(source).toContain("parentElementId: null");
    expect(source).toContain("clonedParentId");
    expect(source).toContain("removeElementTree");
    expect(source).toContain("siblingFilter");
  });
});
