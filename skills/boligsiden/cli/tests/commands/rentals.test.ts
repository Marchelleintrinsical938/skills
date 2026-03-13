import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface Rental {
  caseID: string;
  priceCash?: number;
  monthlyExpense?: number;
  housingArea?: number;
  numberOfRooms?: number;
  address?: {
    municipality?: string;
    city?: string;
    zipCode?: string;
  };
}

interface RentalsResult {
  cases: Rental[];
  totalHits: number;
}

describe("rentals command", () => {
  test("returns valid JSON with cases array and totalHits", async () => {
    const result = await runCLI(["rentals", "--per-page", "3"]);
    const data = parseJSON<RentalsResult>(result);

    expect(data).toHaveProperty("cases");
    expect(data).toHaveProperty("totalHits");
    expect(Array.isArray(data.cases)).toBe(true);
    expect(typeof data.totalHits).toBe("number");
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("respects --per-page limit", async () => {
    const result = await runCLI(["rentals", "--per-page", "5"]);
    const data = parseJSON<RentalsResult>(result);

    expect(data.cases.length).toBeLessThanOrEqual(5);
  });

  test("each rental has expected fields", async () => {
    const result = await runCLI(["rentals", "--per-page", "1"]);
    const data = parseJSON<RentalsResult>(result);

    expect(data.cases.length).toBeGreaterThan(0);
    const r = data.cases[0];
    expect(r).toHaveProperty("caseID");
    expect(typeof r.caseID).toBe("string");
    expect(r.caseID.length).toBeGreaterThan(0);
  });

  test("filters by municipality", async () => {
    const result = await runCLI([
      "rentals",
      "--municipalities",
      "København",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<RentalsResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
  });

  test("filters by address type", async () => {
    const result = await runCLI([
      "rentals",
      "--address-types",
      "condo",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<RentalsResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("filters by min and max price", async () => {
    const result = await runCLI([
      "rentals",
      "--min-price",
      "5000",
      "--max-price",
      "20000",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<RentalsResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("filters by min rooms", async () => {
    const result = await runCLI([
      "rentals",
      "--min-rooms",
      "2",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<RentalsResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
    expect(data.totalHits).toBeGreaterThan(0);
    expect(data.cases.length).toBeGreaterThan(0);
    for (const r of data.cases) {
      if (r.numberOfRooms !== undefined) {
        expect(r.numberOfRooms).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test("sorts by price ascending", async () => {
    const result = await runCLI([
      "rentals",
      "--sort-by",
      "price",
      "--sort-ascending",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<RentalsResult>(result);

    expect(Array.isArray(data.cases)).toBe(true);
  });

  test("pagination works", async () => {
    const page1 = await runCLI(["rentals", "--page", "1", "--per-page", "3"]);
    const page2 = await runCLI(["rentals", "--page", "2", "--per-page", "3"]);

    const data1 = parseJSON<RentalsResult>(page1);
    const data2 = parseJSON<RentalsResult>(page2);

    expect(Array.isArray(data1.cases)).toBe(true);
    expect(Array.isArray(data2.cases)).toBe(true);

    if (data1.cases.length > 0 && data2.cases.length > 0) {
      expect(data1.cases[0].caseID).not.toBe(data2.cases[0].caseID);
    }
  });

  test("outputs table format without error", async () => {
    const result = await runCLI([
      "rentals",
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
      "rentals",
      "--per-page",
      "3",
      "--format",
      "plain",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
