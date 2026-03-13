import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

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
  meta: { total: number; page: number; perPage: number };
  results: SearchResult[];
}

interface DetailResult {
  id: string;
  title: string;
  company: string | null;
  companyUrl: string | null;
  location: string | null;
  date: string | null;
  deadline: string | null;
  employmentType: string | null;
  hours: string | null;
  applyUrl: string | null;
  url: string;
  description: string | null;
}

// Helper: get a real job ID from the search command
async function getJobId(): Promise<{ id: string; url: string }> {
  const result = await runCLI(["search", "--query", "developer", "--limit", "1"]);
  const data = parseJSON<SearchResponse>(result);
  if (data.results.length === 0) {
    throw new Error("No search results found to test detail command");
  }
  return { id: data.results[0].id, url: data.results[0].url };
}

describe("detail command", () => {
  test("fetching detail by id returns correct structure", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("company");
    expect(data).toHaveProperty("companyUrl");
    expect(data).toHaveProperty("location");
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("deadline");
    expect(data).toHaveProperty("employmentType");
    expect(data).toHaveProperty("hours");
    expect(data).toHaveProperty("applyUrl");
    expect(data).toHaveProperty("url");
    expect(data).toHaveProperty("description");
  });

  test("detail id matches the requested id", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    expect(data.id).toBe(id);
  });

  test("detail title is a non-empty string", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    expect(typeof data.title).toBe("string");
    expect(data.title.length).toBeGreaterThan(0);
  });

  test("detail url is a valid jobindex.dk URL", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    expect(typeof data.url).toBe("string");
    expect(data.url).toMatch(/^https:\/\/www\.jobindex\.dk\/jobannonce\//);
  });

  test("nullable fields are either string or null", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    const nullableFields: (keyof DetailResult)[] = [
      "company",
      "companyUrl",
      "location",
      "date",
      "deadline",
      "employmentType",
      "hours",
      "applyUrl",
      "description",
    ];

    for (const field of nullableFields) {
      const val = data[field];
      expect(val === null || typeof val === "string").toBe(true);
    }
  });

  test("date field follows ISO YYYY-MM-DD format when present", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResult>(result);

    if (data.date !== null) {
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("fetching detail by full URL works", async () => {
    const { url } = await getJobId();
    const result = await runCLI(["detail", url]);
    const data = parseJSON<DetailResult>(result);

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("title");
    expect(typeof data.title).toBe("string");
    expect(data.title.length).toBeGreaterThan(0);
  });

  test("detail via full url matches detail via id", async () => {
    const { id, url } = await getJobId();

    const byId = await runCLI(["detail", id]);
    const byUrl = await runCLI(["detail", url]);
    const dataById = parseJSON<DetailResult>(byId);
    const dataByUrl = parseJSON<DetailResult>(byUrl);

    expect(dataById.id).toBe(dataByUrl.id);
    expect(dataById.title).toBe(dataByUrl.title);
  });

  test("--format plain outputs without error", async () => {
    const { id } = await getJobId();
    const result = await runCLI(["detail", id, "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("invalid id returns error on stderr", async () => {
    const result = await runCLI(["detail", "h0000000000000"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
    const err = JSON.parse(result.stderr);
    expect(err).toHaveProperty("error");
    expect(err).toHaveProperty("code");
  });
});
