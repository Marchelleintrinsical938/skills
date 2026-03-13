import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SoldProperty {
  caseID?: string;
  addressID?: string;
  priceCash?: number;
  housingArea?: number;
  address?: {
    municipality?: string;
    city?: string;
    zipCode?: string;
    road?: string;
  };
  registrations?: Array<{
    date?: string;
    amount?: number;
    price?: number;
  }>;
}

interface SoldResult {
  cases: SoldProperty[];
  totalHits: number;
}

describe("sold command", () => {
  test("returns valid JSON with cases array and totalHits", async () => {
    const result = await runCLI([
      "sold",
      "--sold-months-back",
      "3",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(data).toHaveProperty("cases");
    expect(data).toHaveProperty("totalHits");
    expect(Array.isArray(data.cases)).toBe(true);
    expect(typeof data.totalHits).toBe("number");
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("respects --per-page limit", async () => {
    const result = await runCLI([
      "sold",
      "--sold-months-back",
      "6",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(data.cases.length).toBeLessThanOrEqual(5);
  });

  test("default sold months back works without flag", async () => {
    const result = await runCLI(["sold", "--per-page", "3"]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThanOrEqual(0);
  });

  test("--sold-months-back 12 returns full year results", async () => {
    const result = await runCLI([
      "sold",
      "--sold-months-back",
      "12",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("filters by municipality", async () => {
    const result = await runCLI([
      "sold",
      "--municipalities",
      "København",
      "--sold-months-back",
      "6",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("filters by address type villa", async () => {
    const result = await runCLI([
      "sold",
      "--address-types",
      "villa",
      "--sold-months-back",
      "6",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("filters by zip code", async () => {
    const result = await runCLI([
      "sold",
      "--zip-codes",
      "2100",
      "--sold-months-back",
      "12",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("filters by price range", async () => {
    const result = await runCLI([
      "sold",
      "--min-price",
      "1000000",
      "--max-price",
      "5000000",
      "--sold-months-back",
      "12",
      "--per-page",
      "10",
    ]);
    const data = parseJSON<SoldResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
    // Sold properties store price in registrations[last].amount — verify all returned cases are in range
    for (const c of data.cases) {
      const regs = c.registrations;
      if (regs && regs.length > 0) {
        const soldPrice = regs[regs.length - 1].amount;
        if (soldPrice !== undefined) {
          expect(soldPrice).toBeGreaterThanOrEqual(1000000);
          expect(soldPrice).toBeLessThanOrEqual(5000000);
        }
      }
    }
  });

  test("pagination works", async () => {
    const page1 = await runCLI([
      "sold",
      "--sold-months-back",
      "12",
      "--page",
      "1",
      "--per-page",
      "3",
    ]);
    const page2 = await runCLI([
      "sold",
      "--sold-months-back",
      "12",
      "--page",
      "2",
      "--per-page",
      "3",
    ]);

    const data1 = parseJSON<SoldResult>(page1);
    const data2 = parseJSON<SoldResult>(page2);

    expect(Array.isArray(data1.cases)).toBe(true);
    expect(Array.isArray(data2.cases)).toBe(true);
  });

  test("outputs table format without error", async () => {
    const result = await runCLI([
      "sold",
      "--sold-months-back",
      "3",
      "--per-page",
      "3",
      "--format",
      "table",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("outputs plain format without error", async () => {
    const result = await runCLI([
      "sold",
      "--sold-months-back",
      "3",
      "--per-page",
      "3",
      "--format",
      "plain",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
