import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface OccupationAlias {
  aliasIdentifier: string;
  conceptUriDa: string;
  alternativeLabelDa: string;
}

interface Occupation {
  conceptUriDa: string;
  preferredLabelDa: string;
  aliases: OccupationAlias[];
}

describe("occupations command", () => {
  test("returns array of occupation objects for a Danish search term", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "sygeplejerske",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<Occupation[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("each occupation has expected fields", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "sygeplejerske",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<Occupation[]>(result);

    expect(data.length).toBeGreaterThan(0);
    const item = data[0];

    expect(item).toHaveProperty("conceptUriDa");
    expect(item).toHaveProperty("preferredLabelDa");
    expect(item).toHaveProperty("aliases");

    expect(typeof item.conceptUriDa).toBe("string");
    expect(item.conceptUriDa.length).toBeGreaterThan(0);
    // Should be an ESCO URI
    expect(item.conceptUriDa).toMatch(/^http/);

    expect(typeof item.preferredLabelDa).toBe("string");
    expect(item.preferredLabelDa.length).toBeGreaterThan(0);

    expect(Array.isArray(item.aliases)).toBe(true);
  });

  test("aliases have expected fields when present", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "sygeplejerske",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<Occupation[]>(result);

    const withAliases = data.filter((o) => o.aliases.length > 0);
    if (withAliases.length > 0) {
      const alias = withAliases[0].aliases[0];
      expect(alias).toHaveProperty("aliasIdentifier");
      expect(alias).toHaveProperty("conceptUriDa");
      expect(alias).toHaveProperty("alternativeLabelDa");
      expect(typeof alias.aliasIdentifier).toBe("string");
      expect(typeof alias.conceptUriDa).toBe("string");
      expect(typeof alias.alternativeLabelDa).toBe("string");
    }
  });

  test("--per-page limits number of results", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "lærer",
      "--per-page",
      "2",
    ]);
    const data = parseJSON<Occupation[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(2);
  });

  test("different search terms return different occupations", async () => {
    const result1 = await runCLI([
      "occupations",
      "--search-string",
      "sygeplejerske",
      "--per-page",
      "3",
    ]);
    const result2 = await runCLI([
      "occupations",
      "--search-string",
      "ingeniør",
      "--per-page",
      "3",
    ]);
    const data1 = parseJSON<Occupation[]>(result1);
    const data2 = parseJSON<Occupation[]>(result2);

    const labels1 = data1.map((o) => o.preferredLabelDa);
    const labels2 = data2.map((o) => o.preferredLabelDa);
    // There should be no exact overlap between nurse and engineer results
    const overlap = labels1.filter((l) => labels2.includes(l));
    expect(overlap.length).toBe(0);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "lærer",
      "--per-page",
      "3",
      "--format",
      "table",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "occupations",
      "--search-string",
      "lærer",
      "--per-page",
      "3",
      "--format",
      "plain",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("missing --search-string returns error on stderr with exit code 1", async () => {
    const result = await runCLI(["occupations"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
