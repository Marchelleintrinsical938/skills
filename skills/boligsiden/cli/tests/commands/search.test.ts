import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface Case {
  caseID: string;
  priceCash?: number;
  housingArea?: number;
  numberOfRooms?: number;
  address?: {
    municipality?: string;
    city?: string;
    zipCode?: string;
  };
}

interface SearchResult {
  cases: Case[];
  totalHits: number;
}

describe("search command", () => {
  test("returns valid JSON with cases array and totalHits", async () => {
    const result = await runCLI(["search", "--per-page", "3"]);
    const data = parseJSON<SearchResult>(result);

    expect(data).toHaveProperty("cases");
    expect(data).toHaveProperty("totalHits");
    expect(Array.isArray(data.cases)).toBe(true);
    expect(typeof data.totalHits).toBe("number");
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("respects --per-page limit", async () => {
    const result = await runCLI(["search", "--per-page", "5"]);
    const data = parseJSON<SearchResult>(result);

    expect(data.cases.length).toBeLessThanOrEqual(5);
  });

  test("each case has expected fields", async () => {
    const result = await runCLI(["search", "--per-page", "1"]);
    const data = parseJSON<SearchResult>(result);

    expect(data.cases.length).toBeGreaterThan(0);
    const c = data.cases[0];
    expect(c).toHaveProperty("caseID");
    expect(typeof c.caseID).toBe("string");
    expect(c.caseID.length).toBeGreaterThan(0);
  });

  test("filters by municipality", async () => {
    const result = await runCLI([
      "search",
      "--municipalities",
      "København",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("filters by address type villa", async () => {
    const result = await runCLI([
      "search",
      "--address-types",
      "villa",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("filters by address type condo", async () => {
    const result = await runCLI([
      "search",
      "--address-types",
      "condo",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("pagination with --page and --per-page", async () => {
    const page1 = await runCLI(["search", "--page", "1", "--per-page", "3"]);
    const page2 = await runCLI(["search", "--page", "2", "--per-page", "3"]);

    const data1 = parseJSON<SearchResult>(page1);
    const data2 = parseJSON<SearchResult>(page2);

    expect(Array.isArray(data1.cases)).toBe(true);
    expect(Array.isArray(data2.cases)).toBe(true);

    // Pages should return different cases
    if (data1.cases.length > 0 && data2.cases.length > 0) {
      expect(data1.cases[0].caseID).not.toBe(data2.cases[0].caseID);
    }
  });

  test("filters by min and max price", async () => {
    const result = await runCLI([
      "search",
      "--min-price",
      "1000000",
      "--max-price",
      "5000000",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    // The API reports hits in the price range even if client-side filtering reduces returned count
    expect(data.totalHits).toBeGreaterThan(0);
    // Any returned cases with a known price must be within the requested range
    for (const c of data.cases) {
      if (c.priceCash !== undefined) {
        expect(c.priceCash).toBeGreaterThanOrEqual(1000000);
        expect(c.priceCash).toBeLessThanOrEqual(5000000);
      }
    }
  });

  test("sorts by price ascending", async () => {
    const result = await runCLI([
      "search",
      "--sort-by",
      "price",
      "--sort-ascending",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.cases.length).toBeGreaterThan(0);

    // Verify ascending order where prices are present
    const prices = data.cases
      .map((c) => c.priceCash)
      .filter((p): p is number => p !== undefined);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test("sorts by price descending (default)", async () => {
    const result = await runCLI([
      "search",
      "--sort-by",
      "price",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("filters by min and max area", async () => {
    const result = await runCLI([
      "search",
      "--min-area",
      "80",
      "--max-area",
      "200",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
    for (const c of data.cases) {
      if (c.housingArea !== undefined) {
        expect(c.housingArea).toBeGreaterThanOrEqual(80);
        expect(c.housingArea).toBeLessThanOrEqual(200);
      }
    }
  });

  test("filters by min and max rooms", async () => {
    const result = await runCLI([
      "search",
      "--min-rooms",
      "3",
      "--max-rooms",
      "6",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
    for (const c of data.cases) {
      if (c.numberOfRooms !== undefined) {
        expect(c.numberOfRooms).toBeGreaterThanOrEqual(3);
        expect(c.numberOfRooms).toBeLessThanOrEqual(6);
      }
    }
  });

  test("--limit caps the cases array", async () => {
    const result = await runCLI([
      "search",
      "--per-page",
      "20",
      "--limit",
      "3",
    ]);
    const data = parseJSON<SearchResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.cases.length).toBeLessThanOrEqual(3);
    expect(data.cases.length).toBeGreaterThan(0);
  });

  test("outputs table format without error", async () => {
    const result = await runCLI([
      "search",
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
      "search",
      "--per-page",
      "3",
      "--format",
      "plain",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
