import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

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
  meta: { total: number | null };
  results: SearchResult[];
}

interface DetailLocation {
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
}

interface DetailCompany {
  name: string;
  logo: string | null;
}

interface DetailResponse {
  id: string;
  url: string;
  title: string;
  description: string;
  datePosted: string;
  deadline: string | null;
  employmentType: string[];
  company: DetailCompany;
  location: DetailLocation;
}

// Helper: get a real job ID by searching first
async function getJobId(): Promise<string> {
  const result = await runCLI(["search", "--key", "developer", "--limit", "1"]);
  const data = parseJSON<SearchResponse>(result);
  if (!data.results.length) {
    throw new Error("No search results to get a job ID from");
  }
  return data.results[0].id;
}

describe("detail command", () => {
  test("detail returns correct structure for a real job ID", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("url");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("description");
    expect(data).toHaveProperty("datePosted");
    expect(data).toHaveProperty("deadline");
    expect(data).toHaveProperty("employmentType");
    expect(data).toHaveProperty("company");
    expect(data).toHaveProperty("location");
  });

  test("detail id field matches requested job ID", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.id).toBe(id);
  });

  test("detail URL points to jobbank.dk", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.url).toMatch(/^https:\/\/jobbank\.dk\/job\//);
  });

  test("detail title is a non-empty string", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(typeof data.title).toBe("string");
    expect(data.title.length).toBeGreaterThan(0);
  });

  test("detail description is a non-empty string (HTML)", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(typeof data.description).toBe("string");
    expect(data.description.length).toBeGreaterThan(0);
  });

  test("detail datePosted is a valid ISO 8601 date string", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(typeof data.datePosted).toBe("string");
    // Should be YYYY-MM-DD format
    expect(data.datePosted).toMatch(/^\d{4}-\d{2}-\d{2}/);
    const d = new Date(data.datePosted);
    expect(isNaN(d.getTime())).toBe(false);
  });

  test("detail deadline is string or null", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.deadline === null || typeof data.deadline === "string").toBe(true);
  });

  test("detail employmentType is an array of strings", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(Array.isArray(data.employmentType)).toBe(true);
    for (const et of data.employmentType) {
      expect(typeof et).toBe("string");
    }
  });

  test("detail company has name and logo fields", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.company).toHaveProperty("name");
    expect(data.company).toHaveProperty("logo");
    expect(typeof data.company.name).toBe("string");
    expect(data.company.name.length).toBeGreaterThan(0);
    expect(data.company.logo === null || typeof data.company.logo === "string").toBe(true);
  });

  test("detail location has required string fields", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.location).toHaveProperty("streetAddress");
    expect(data.location).toHaveProperty("city");
    expect(data.location).toHaveProperty("postalCode");
    expect(data.location).toHaveProperty("country");
    expect(typeof data.location.streetAddress).toBe("string");
    expect(typeof data.location.city).toBe("string");
    expect(typeof data.location.postalCode).toBe("string");
    expect(typeof data.location.country).toBe("string");
  });

  test("--format plain outputs without error", async () => {
    const id = await getJobId();
    const result = await runCLI(["detail", id, "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("invalid job ID returns error with code NOT_FOUND or API_ERROR", async () => {
    const result = await runCLI(["detail", "0000000001"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
    const err = JSON.parse(result.stderr);
    expect(err).toHaveProperty("error");
    expect(err).toHaveProperty("code");
    expect(["NOT_FOUND", "API_ERROR", "PARSE_ERROR"]).toContain(err.code);
  });
});
