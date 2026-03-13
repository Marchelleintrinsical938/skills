import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchMeta {
  searchGuid: string;
  totalCount: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
  minPage: number;
  maxPage: number;
  showBanners: boolean;
}

interface SearchResult {
  id: number;
  price: number;
  street: string;
  zipCode: number;
  city: string;
  rooms: number;
  size: number;
  propertyType: number;
  ouId: number;
  ouAddress: string;
}

interface SearchResponse {
  meta: SearchMeta;
  results: SearchResult[];
}

describe("search command", () => {
  test("basic search returns { meta, results } with correct structure", async () => {
    const result = await runCLI(["search", "--page-size", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");

    expect(typeof data.meta.totalCount).toBe("number");
    expect(typeof data.meta.totalPages).toBe("number");
    expect(typeof data.meta.pageIndex).toBe("number");
    expect(typeof data.meta.pageSize).toBe("number");

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("meta has correct fields", async () => {
    const result = await runCLI(["search", "--page-size", "2"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta).toHaveProperty("searchGuid");
    expect(data.meta).toHaveProperty("totalCount");
    expect(data.meta).toHaveProperty("totalPages");
    expect(data.meta).toHaveProperty("pageIndex");
    expect(data.meta).toHaveProperty("pageSize");
    expect(data.meta).toHaveProperty("minPage");
    expect(data.meta).toHaveProperty("maxPage");
    expect(data.meta.pageIndex).toBe(1);
    expect(data.meta.pageSize).toBe(2);
  });

  test("results have expected fields", async () => {
    const result = await runCLI(["search", "--page-size", "2"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];
    expect(typeof item.id).toBe("number");
    expect(typeof item.price).toBe("number");
    expect(typeof item.street).toBe("string");
    expect(typeof item.zipCode).toBe("number");
    expect(typeof item.city).toBe("string");
    expect(typeof item.ouId).toBe("number");
    expect(typeof item.ouAddress).toBe("string");
  });

  test("filter by zip code (--zip-codes 2100)", async () => {
    const result = await runCLI([
      "search",
      "--zip-codes",
      "2100",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.zipCode).toBe(2100);
    }
  });

  test("filter by property type (--property-type 1)", async () => {
    const result = await runCLI([
      "search",
      "--property-type",
      "1",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.propertyType).toBe(1);
    }
  });

  test("filter by price range (--price-min 1000000 --price-max 5000000)", async () => {
    const result = await runCLI([
      "search",
      "--price-min",
      "1000000",
      "--price-max",
      "5000000",
      "--page-size",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.price).toBeGreaterThanOrEqual(1000000);
      expect(item.price).toBeLessThanOrEqual(5000000);
    }
  });

  test("pagination (--page 1 --page-size 3)", async () => {
    const result = await runCLI(["search", "--page", "1", "--page-size", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.pageIndex).toBe(1);
    expect(data.meta.pageSize).toBe(3);
    expect(data.results.length).toBeLessThanOrEqual(3);
  });

  test("second page returns different results than first page", async () => {
    const page1 = await runCLI(["search", "--page", "1", "--page-size", "3"]);
    const page2 = await runCLI(["search", "--page", "2", "--page-size", "3"]);
    const data1 = parseJSON<SearchResponse>(page1);
    const data2 = parseJSON<SearchResponse>(page2);

    expect(data1.results.length).toBeGreaterThan(0);
    expect(data2.results.length).toBeGreaterThan(0);

    const ids1 = data1.results.map((r) => r.id);
    const ids2 = data2.results.map((r) => r.id);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });

  test("sort by price ascending (--sort price-a)", async () => {
    const result = await runCLI([
      "search",
      "--sort",
      "price-a",
      "--page-size",
      "5",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const prices = data.results.map((r) => r.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test("--limit caps results array", async () => {
    const result = await runCLI([
      "search",
      "--page-size",
      "10",
      "--limit",
      "2",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(2);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--page-size",
      "3",
      "--format",
      "table",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--page-size",
      "3",
      "--format",
      "plain",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
