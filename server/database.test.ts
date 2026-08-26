import { describe, expect, it } from "vitest";
import { getMySqlPoolOptions } from "./database";

describe("configuração MySQL", () => {
  it("aplica TLS e porta padrão TiDB Cloud a uma URL de produção", () => {
    expect(getMySqlPoolOptions("mysql://user:pass@cluster.tidbcloud.com/app")).toMatchObject({
      host: "cluster.tidbcloud.com",
      port: 4000,
      user: "user",
      database: "app",
      ssl: { minVersion: "TLSv1.2" },
      enableKeepAlive: true,
    });
  });

  it("mantém URLs MySQL locais sem TLS forçado", () => {
    const config = getMySqlPoolOptions("mysql://root:password@127.0.0.1:3306/homebrew");
    expect(config).toMatchObject({
      host: "127.0.0.1",
      port: 3306,
      database: "homebrew",
    });
    expect(config).not.toHaveProperty("ssl");
  });
});
