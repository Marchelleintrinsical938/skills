import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchMeta {
  total: number;
  page: number;
  perPage: number;
}

interface SearchResult {
  id: string;
  title: string;
  company: string | null;
  companyUrl: string | null;
  location: string | null;
  date: string | null;
  url: string;
  description: string | null;
}

interface SearchResponse {
  meta: SearchMeta;
  results: SearchResult[];
}

describe("search command", () => {
  test("basic search returns { meta, results } with correct structure", async () => {
    const result = await runCLI(["search", "--query", "developer"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");

    expect(typeof data.meta.total).toBe("number");
    expect(typeof data.meta.page).toBe("number");
    expect(typeof data.meta.perPage).toBe("number");

    expect(data.meta.total).toBeGreaterThan(0);
    expect(data.meta.page).toBe(1);
    expect(data.meta.perPage).toBe(20);

    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("results have expected fields", async () => {
    const result = await runCLI(["search", "--query", "developer"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];

    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
    expect(typeof item.title).toBe("string");
    expect(item.title.length).toBeGreaterThan(0);
    expect(typeof item.url).toBe("string");
    expect(item.url).toMatch(/^https:\/\/www\.jobindex\.dk\//);

    // Nullable fields: company, companyUrl, location, date, description
    expect(item.company === null || typeof item.company === "string").toBe(true);
    expect(item.companyUrl === null || typeof item.companyUrl === "string").toBe(true);
    expect(item.location === null || typeof item.location === "string").toBe(true);
    expect(item.date === null || typeof item.date === "string").toBe(true);
    expect(item.description === null || typeof item.description === "string").toBe(true);
  });

  test("result id is prefixed with 'h'", async () => {
    const result = await runCLI(["search", "--query", "developer"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    // At least some results should have IDs that start with 'h' (PaidJob type)
    const hIds = data.results.filter((r) => r.id.startsWith("h"));
    expect(hIds.length).toBeGreaterThan(0);
  });

  test("date field follows ISO YYYY-MM-DD format when present", async () => {
    const result = await runCLI(["search", "--query", "developer"]);
    const data = parseJSON<SearchResponse>(result);

    const itemsWithDate = data.results.filter((r) => r.date !== null);
    expect(itemsWithDate.length).toBeGreaterThan(0);
    for (const item of itemsWithDate) {
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("search with --query 'python' returns results", async () => {
    const result = await runCLI(["search", "--query", "python"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.total).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("pagination: --page 1 returns meta.page = 1", async () => {
    const result = await runCLI(["search", "--query", "developer", "--page", "1"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.page).toBe(1);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("pagination: --page 2 returns different results than page 1", async () => {
    const page1 = await runCLI(["search", "--query", "developer", "--page", "1"]);
    const page2 = await runCLI(["search", "--query", "developer", "--page", "2"]);
    const data1 = parseJSON<SearchResponse>(page1);
    const data2 = parseJSON<SearchResponse>(page2);

    expect(data1.results.length).toBeGreaterThan(0);
    expect(data2.results.length).toBeGreaterThan(0);

    const ids1 = data1.results.map((r) => r.id);
    const ids2 = data2.results.map((r) => r.id);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });

  test("filter by jobage (--jobage 7) returns results", async () => {
    const result = await runCLI(["search", "--query", "developer", "--jobage", "7"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("filter by jobage 1 (today only) returns fewer results than jobage 9999", async () => {
    const allTime = await runCLI(["search", "--query", "developer", "--jobage", "9999"]);
    const today = await runCLI(["search", "--query", "developer", "--jobage", "1"]);
    const dataAllTime = parseJSON<SearchResponse>(allTime);
    const dataToday = parseJSON<SearchResponse>(today);

    expect(dataAllTime.meta.total).toBeGreaterThanOrEqual(dataToday.meta.total);
  });

  test("sort by date (--sort date) returns results", async () => {
    const result = await runCLI(["search", "--query", "developer", "--sort", "date"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.total).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("sort by score (--sort score, default) returns results", async () => {
    const result = await runCLI(["search", "--query", "developer", "--sort", "score"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.total).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("--limit 3 caps results to at most 3 items", async () => {
    const result = await runCLI(["search", "--query", "developer", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(3);
    // meta.total should still reflect the full count
    expect(data.meta.total).toBeGreaterThan(0);
  });

  test("--limit 1 returns exactly 1 result", async () => {
    const result = await runCLI(["search", "--query", "developer", "--limit", "1"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBe(1);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["search", "--query", "developer", "--format", "table"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["search", "--query", "developer", "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("missing --query returns error on stderr with code MISSING_REQUIRED", async () => {
    const result = await runCLI(["search"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
    const err = JSON.parse(result.stderr);
    expect(err).toHaveProperty("error");
    expect(err).toHaveProperty("code");
    expect(err.code).toBe("MISSING_REQUIRED");
  });
});
