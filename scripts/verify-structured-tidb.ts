import { createPool } from "mysql2/promise";
import { getMySqlPoolOptions } from "../server/database";

const url = process.env.TIDB_DATABASE_URL;
if (!url) throw new Error("TIDB_DATABASE_URL é obrigatório.");

const pool = createPool(getMySqlPoolOptions(url));
try {
  const [rows] = await pool.query("SHOW TABLES");
  const tableNames = (rows as Array<Record<string, string>>).flatMap(row => Object.values(row));
  const expected = [
    "homebrewStructuredElements", "structuredAttributeBonuses", "structuredRequirements", "structuredEffects",
    "structuredCosts", "structuredDamageProfiles", "structuredRanges", "structuredConditions",
    "structuredVowExchanges", "structuredEvolutions", "structuredWeaponTechniqueLinks",
  ];
  console.info(JSON.stringify({ present: expected.filter(table => tableNames.includes(table)), missing: expected.filter(table => !tableNames.includes(table)) }));
} finally {
  await pool.end();
}
