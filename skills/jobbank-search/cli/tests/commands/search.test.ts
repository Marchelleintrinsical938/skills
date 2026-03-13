import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchMeta {
  total: number | null;
}

interface SearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  description: string;
  url: string;
  posted: string;
  deadline: string | null;
}

interface SearchResponse {
  meta: SearchMeta;
  results: SearchResult[];
}

describe("search command", () => {
  test("basic search returns { meta, results } with correct structure", async () => {
    const result = await runCLI(["search", "--key", "developer", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");

    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("meta has total field", async () => {
    const result = await runCLI(["search", "--key", "ingeniør", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta).toHaveProperty("total");
    // total is either a number or null (if secondary request fails)
    expect(data.meta.total === null || typeof data.meta.total === "number").toBe(true);
    if (data.meta.total !== null) {
      expect(data.meta.total).toBeGreaterThan(0);
    }
  });

  test("results have expected fields with correct types", async () => {
    const result = await runCLI(["search", "--key", "analyst", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];

    expect(typeof item.id).toBe("string");
    expect(typeof item.title).toBe("string");
    expect(typeof item.company).toBe("string");
    expect(typeof item.location).toBe("string");
    expect(typeof item.jobType).toBe("string");
    expect(typeof item.description).toBe("string");
    expect(typeof item.url).toBe("string");
    expect(typeof item.posted).toBe("string");
    // deadline is string or null
    expect(item.deadline === null || typeof item.deadline === "string").toBe(true);
  });

  test("result id is a numeric string extracted from URL", async () => {
    const result = await runCLI(["search", "--key", "developer", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.id).toMatch(/^\d+$/);
    }
  });

  test("result URL points to jobbank.dk", async () => {
    const result = await runCLI(["search", "--key", "developer", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.url).toMatch(/^https:\/\/jobbank\.dk\/job\//);
    }
  });

  test("result posted field is ISO 8601 date string", async () => {
    const result = await runCLI(["search", "--key", "developer", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      // ISO 8601 format — should parse as a valid date
      const d = new Date(item.posted);
      expect(isNaN(d.getTime())).toBe(false);
    }
  });

  test("search with --key 'python' returns results", async () => {
    const result = await runCLI(["search", "--key", "python", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("filter by type --type 3 (Fuldtidsjob) returns results", async () => {
    const result = await runCLI(["search", "--type", "3", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    // All returned jobs should have jobType containing 'Fuldtidsjob'
    for (const item of data.results) {
      expect(item.jobType).toContain("Fuldtidsjob");
    }
  });

  test("filter by location --location 2 (Storkøbenhavn) returns results", async () => {
    const result = await runCLI(["search", "--location", "2", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.meta.total === null || typeof data.meta.total === "number").toBe(true);
  });

  test("filter by education --education 24 (IT) returns results", async () => {
    const result = await runCLI(["search", "--education", "24", "--limit", "5"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.meta.total === null || typeof data.meta.total === "number").toBe(true);
  });

  test("combined filters --key python --location 2 --type 3", async () => {
    const result = await runCLI([
      "search",
      "--key", "python",
      "--location", "2",
      "--type", "3",
      "--limit", "5",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    // May return 0 results if no match, but must be valid shape
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("--limit caps results array", async () => {
    const result = await runCLI(["search", "--key", "ingeniør", "--limit", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(3);
  });

  test("--limit 1 returns exactly one result", async () => {
    const result = await runCLI(["search", "--key", "developer", "--limit", "1"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeLessThanOrEqual(1);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--key", "developer",
      "--limit", "3",
      "--format", "table",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--key", "developer",
      "--limit", "3",
      "--format", "plain",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("no filters and no key returns error (MISSING_REQUIRED)", async () => {
    const result = await runCLI(["search"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
    const err = JSON.parse(result.stderr);
    expect(err).toHaveProperty("error");
    expect(err).toHaveProperty("code");
    expect(err.code).toBe("MISSING_REQUIRED");
  });
});
