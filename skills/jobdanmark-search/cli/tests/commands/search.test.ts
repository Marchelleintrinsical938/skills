import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchMeta {
  currentPage: number;
  totalItems: number;
  itemsPrPage: number;
  totalPages: number;
}

interface CompanyLogo {
  key: string;
  url: string;
  focalPoint: { top: number; left: number } | null;
}

interface SearchResult {
  title: string;
  companyName: string;
  companyLogo: CompanyLogo | null;
  companyLogoSvgMarkup: string | null;
  overlayColor: string | null;
  companyAddress: string;
  jobTypes: string[];
  boostJob: boolean;
  publishedDate: string;
  applicationDeadline: string | null;
  url: string;
  slug: string;
  coverImage: CompanyLogo | null;
  silhouetteLogo: boolean;
}

interface SearchResponse {
  meta: SearchMeta;
  results: SearchResult[];
}

describe("search command", () => {
  test("basic search returns { meta, results } with correct structure", async () => {
    const result = await runCLI(["search"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");

    expect(typeof data.meta.currentPage).toBe("number");
    expect(typeof data.meta.totalItems).toBe("number");
    expect(typeof data.meta.itemsPrPage).toBe("number");
    expect(typeof data.meta.totalPages).toBe("number");

    expect(data.meta.totalItems).toBeGreaterThan(0);
    expect(data.meta.totalPages).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("meta has correct fields and values", async () => {
    const result = await runCLI(["search"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta).toHaveProperty("currentPage");
    expect(data.meta).toHaveProperty("totalItems");
    expect(data.meta).toHaveProperty("itemsPrPage");
    expect(data.meta).toHaveProperty("totalPages");

    expect(data.meta.currentPage).toBe(1);
    expect(data.meta.itemsPrPage).toBe(30);
  });

  test("results have expected fields with correct types", async () => {
    const result = await runCLI(["search", "--limit", "1"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];

    expect(typeof item.title).toBe("string");
    expect(typeof item.companyName).toBe("string");
    expect(typeof item.companyAddress).toBe("string");
    expect(Array.isArray(item.jobTypes)).toBe(true);
    expect(typeof item.boostJob).toBe("boolean");
    expect(typeof item.publishedDate).toBe("string");
    expect(typeof item.url).toBe("string");
    expect(typeof item.slug).toBe("string");
    expect(typeof item.silhouetteLogo).toBe("boolean");

    // url should be a full URL
    expect(item.url).toMatch(/^https:\/\/jobdanmark\.dk\//);
    // slug should be a non-empty string (path segment)
    expect(item.slug.length).toBeGreaterThan(0);
    // publishedDate should match DD-MM-YYYY format
    expect(item.publishedDate).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  });

  test("filter by text (--text 'udvikler')", async () => {
    const result = await runCLI(["search", "--text", "udvikler"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalItems).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("filter by category (--category 227978 for IT)", async () => {
    const result = await runCLI(["search", "--category", "227978"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalItems).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("filter by job-type fuldtid (--job-type fuldtid)", async () => {
    const result = await runCLI(["search", "--job-type", "fuldtid", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalItems).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);

    // All returned results should have fuldtid in their jobTypes
    for (const item of data.results) {
      expect(item.jobTypes).toContain("fuldtid");
    }
  });

  test("filter by multiple job-types (--job-type fuldtid,deltid)", async () => {
    const result = await runCLI(["search", "--job-type", "fuldtid,deltid", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalItems).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("pagination (--page 2)", async () => {
    const page1Result = await runCLI(["search"]);
    const page2Result = await runCLI(["search", "--page", "2"]);
    const page1 = parseJSON<SearchResponse>(page1Result);
    const page2 = parseJSON<SearchResponse>(page2Result);

    expect(page2.meta.currentPage).toBe(2);
    expect(page1.results.length).toBeGreaterThan(0);
    expect(page2.results.length).toBeGreaterThan(0);

    // Pages should have different results
    const slugs1 = page1.results.map((r) => r.slug);
    const slugs2 = page2.results.map((r) => r.slug);
    const overlap = slugs1.filter((s) => slugs2.includes(s));
    expect(overlap.length).toBe(0);
  });

  test("--limit caps results array", async () => {
    const result = await runCLI(["search", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(3);
  });

  test("--limit 1 returns exactly 1 result", async () => {
    const result = await runCLI(["search", "--limit", "1"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBe(1);
    // meta still reflects total available on server
    expect(data.meta.totalItems).toBeGreaterThan(1);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["search", "--limit", "3", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["search", "--limit", "3", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("combined filters: text + job-type + category", async () => {
    const result = await runCLI([
      "search",
      "--text", "ingeniør",
      "--category", "227978",
      "--job-type", "fuldtid",
      "--limit", "5",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
  });
});
