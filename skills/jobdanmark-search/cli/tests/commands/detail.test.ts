import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface HiringOrganization {
  name: string;
  logo: string | null;
}

interface JobLocation {
  streetAddress: string | null;
  addressLocality: string | null;
  addressRegion: string | null;
  postalCode: string | null;
  addressCountry: string | null;
}

interface JobDetail {
  slug: string;
  url: string;
  title: string;
  datePosted: string;
  validThrough: string | null;
  employmentType: string[];
  hiringOrganization: HiringOrganization;
  jobLocation: JobLocation;
  description: string;
}

interface SearchMeta {
  currentPage: number;
  totalItems: number;
  itemsPrPage: number;
  totalPages: number;
}

interface SearchResult {
  slug: string;
  title: string;
}

interface SearchResponse {
  meta: SearchMeta;
  results: SearchResult[];
}

async function getFirstSlug(): Promise<string> {
  const proc = Bun.spawn(
    ["bun", "run", new URL("../../src/cli.ts", import.meta.url).pathname, "search", "--limit", "1"],
    { stdout: "pipe", stderr: "pipe" }
  );
  const [stdout] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  const data = JSON.parse(stdout.trim()) as SearchResponse;
  if (!data.results || data.results.length === 0) {
    throw new Error("No search results to derive a slug from");
  }
  return data.results[0].slug;
}

describe("detail command", () => {
  test("returns correct structure for a valid slug", async () => {
    const slug = await getFirstSlug();
    const result = await runCLI(["detail", slug]);
    const data = parseJSON<JobDetail>(result);

    expect(data).toHaveProperty("slug");
    expect(data).toHaveProperty("url");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("datePosted");
    expect(data).toHaveProperty("validThrough");
    expect(data).toHaveProperty("employmentType");
    expect(data).toHaveProperty("hiringOrganization");
    expect(data).toHaveProperty("jobLocation");
    expect(data).toHaveProperty("description");
  });

  test("slug and url match the requested job", async () => {
    const slug = await getFirstSlug();
    const result = await runCLI(["detail", slug]);
    const data = parseJSON<JobDetail>(result);

    expect(data.slug).toBe(slug);
    expect(data.url).toBe(`https://jobdanmark.dk/job/${slug}`);
  });

  test("fields have correct types", async () => {
    const slug = await getFirstSlug();
    const result = await runCLI(["detail", slug]);
    const data = parseJSON<JobDetail>(result);

    expect(typeof data.title).toBe("string");
    expect(typeof data.datePosted).toBe("string");
    expect(Array.isArray(data.employmentType)).toBe(true);
    expect(typeof data.hiringOrganization.name).toBe("string");
    expect(typeof data.description).toBe("string");

    // datePosted should be YYYY-MM-DD
    expect(data.datePosted).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // description should be non-empty HTML
    expect(data.description.length).toBeGreaterThan(0);
  });

  test("hiringOrganization has name and optional logo", async () => {
    const slug = await getFirstSlug();
    const result = await runCLI(["detail", slug]);
    const data = parseJSON<JobDetail>(result);

    expect(typeof data.hiringOrganization.name).toBe("string");
    expect(data.hiringOrganization.name.length).toBeGreaterThan(0);
    // logo may be null or a string URL
    if (data.hiringOrganization.logo !== null) {
      expect(typeof data.hiringOrganization.logo).toBe("string");
    }
  });

  test("--format plain outputs without error", async () => {
    const slug = await getFirstSlug();
    const result = await runCLI(["detail", slug, "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("invalid slug returns error on stderr with exit code 1", async () => {
    const result = await runCLI(["detail", "this-slug-does-not-exist-xyz-abc-123"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);

    let err: { error: string; code: string } | undefined;
    try {
      err = JSON.parse(result.stderr);
    } catch {
      // stderr may not be JSON in all cases
    }
    if (err) {
      expect(typeof err.error).toBe("string");
      expect(typeof err.code).toBe("string");
    }
  });
});
