import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SoldMeta {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  minPage: number;
  maxPage: number;
  countFrom: number;
  countTo: number;
}

interface SoldResult {
  estateId: number;
  address: string;
  zipCode: number;
  price: number;
  soldDate: string;
  propertyType: number;
  saleType: string;
  sqmPrice: number;
  rooms: number;
  size: number;
  buildYear: number;
  change: number;
  city: string;
  ouId: number;
  ouAddress: string;
}

interface SoldResponse {
  meta: SoldMeta;
  results: SoldResult[];
}

describe("sold command", () => {
  test("basic sold search returns { meta, results }", async () => {
    const result = await runCLI(["sold", "--page-size", "3"]);
    const data = parseJSON<SoldResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("meta has correct fields", async () => {
    const result = await runCLI(["sold", "--page-size", "3"]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.meta).toHaveProperty("pageIndex");
    expect(data.meta).toHaveProperty("pageSize");
    expect(data.meta).toHaveProperty("totalCount");
    expect(data.meta).toHaveProperty("totalPages");
    expect(data.meta).toHaveProperty("minPage");
    expect(data.meta).toHaveProperty("maxPage");
    expect(data.meta.totalCount).toBeGreaterThan(0);
  });

  test("results have soldDate, price, address, zipCode", async () => {
    const result = await runCLI(["sold", "--page-size", "3"]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(typeof item.soldDate).toBe("string");
      expect(item.soldDate.length).toBeGreaterThan(0);
      expect(typeof item.price).toBe("number");
      expect(item.price).toBeGreaterThan(0);
      expect(typeof item.address).toBe("string");
      expect(item.address.length).toBeGreaterThan(0);
      expect(typeof item.zipCode).toBe("number");
    }
  });

  test("results have expected additional fields", async () => {
    const result = await runCLI(["sold", "--page-size", "2"]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];
    expect(typeof item.propertyType).toBe("number");
    expect(typeof item.saleType).toBe("string");
    expect(typeof item.sqmPrice).toBe("number");
    expect(typeof item.size).toBe("number");
    expect(typeof item.ouId).toBe("number");
    expect(typeof item.ouAddress).toBe("string");
  });

  test("filter by zip code (--zip-codes 2100)", async () => {
    const result = await runCLI([
      "sold",
      "--zip-codes",
      "2100",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.zipCode).toBe(2100);
    }
  });

  test("filter by price range (--price-min 1000000 --price-max 3000000)", async () => {
    const result = await runCLI([
      "sold",
      "--price-min",
      "1000000",
      "--price-max",
      "3000000",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.price).toBeGreaterThanOrEqual(1000000);
      expect(item.price).toBeLessThanOrEqual(3000000);
    }
  });

  test("filter by property type (--property-type 3)", async () => {
    const result = await runCLI([
      "sold",
      "--property-type",
      "3",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.propertyType).toBe(3);
    }
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["sold", "--page-size", "3", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["sold", "--page-size", "3", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--limit caps results array", async () => {
    const result = await runCLI(["sold", "--page-size", "10", "--limit", "2"]);
    const data = parseJSON<SoldResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(2);
  });
});
