import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface Municipality {
  name: string;
  code: number;
  population?: number;
  taxRate?: number;
  churchTaxRate?: number;
  area?: number;
  [key: string]: unknown;
}

describe("municipalities command", () => {
  test("returns valid JSON array", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    expect(Array.isArray(data)).toBe(true);
  });

  test("returns approximately 98 municipalities", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    // Denmark has exactly 98 municipalities
    expect(data.length).toBeGreaterThanOrEqual(95);
    expect(data.length).toBeLessThanOrEqual(101);
  });

  test("each municipality has a name field", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    for (const m of data) {
      expect(m).toHaveProperty("name");
      expect(typeof m.name).toBe("string");
      expect(m.name.length).toBeGreaterThan(0);
    }
  });

  test("each municipality has a code field", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    for (const m of data) {
      expect(m).toHaveProperty("code");
      expect(typeof m.code).toBe("number");
    }
  });

  test("each municipality has a population field", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    for (const m of data) {
      expect(m).toHaveProperty("population");
    }
  });

  test("well-known municipalities are present", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    const names = data.map((m) => m.name.toLowerCase());
    expect(names.some((n) => n.includes("københavn"))).toBe(true);
    expect(names.some((n) => n.includes("aarhus"))).toBe(true);
    expect(names.some((n) => n.includes("odense"))).toBe(true);
  });

  test("municipality codes are unique", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    const codes = data.map((m) => m.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  test("--limit caps results", async () => {
    const result = await runCLI(["municipalities", "--limit", "5"]);
    const data = parseJSON<Municipality[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(5);
    expect(data.length).toBeGreaterThan(0);
  });

  test("outputs table format without error", async () => {
    const result = await runCLI(["municipalities", "--format", "table"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("outputs plain format without error", async () => {
    const result = await runCLI(["municipalities", "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("municipality names are valid strings (not empty, not null)", async () => {
    const result = await runCLI(["municipalities"]);
    const data = parseJSON<Municipality[]>(result);

    for (const m of data) {
      expect(m.name).toBeTruthy();
      expect(m.name.trim().length).toBeGreaterThan(0);
    }
  });
});
