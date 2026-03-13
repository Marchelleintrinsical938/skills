import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchMeta {
  totalJobAdCount: number;
  pageNumber: number;
  resultsPerPage: number;
  searchString: string | null;
}

interface FacetItem {
  type: string;
  jobAdCount: number;
}

interface OccupationAreaFacet {
  identifier: string;
  jobAdCount: number;
}

interface CountryFacet {
  label: string;
  identifier: string;
  jobAdCount: number;
}

interface SearchFacets {
  regions: FacetItem[];
  workHours: FacetItem[];
  employmentDurations: FacetItem[];
  occupationAreas: OccupationAreaFacet[];
  countries: CountryFacet[];
}

interface SearchResult {
  jobAdId: string;
  title: string;
  hiringOrgName: string;
  occupation: string | null;
  municipality: string | null;
  postalCode: number | null;
  postalDistrictName: string | null;
  country: string;
  publicationDate: string;
  applicationDeadline: string | null;
  applicationDeadlineStatus: string | null;
  workHourPartTime: boolean;
  isExternal: boolean;
  hasLogo: boolean;
  logoUrl: string | null;
  cvr: string | null;
  workPlaceAddress: string;
  isSeen: boolean;
  isFavorite: boolean;
}

interface SearchResponse {
  meta: SearchMeta;
  facets: SearchFacets;
  results: SearchResult[];
}

describe("search command", () => {
  test("basic search returns { meta, facets, results } with correct structure", async () => {
    const result = await runCLI(["search", "--per-page", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("facets");
    expect(data).toHaveProperty("results");

    expect(typeof data.meta.totalJobAdCount).toBe("number");
    expect(typeof data.meta.pageNumber).toBe("number");
    expect(typeof data.meta.resultsPerPage).toBe("number");

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("meta has correct fields", async () => {
    const result = await runCLI(["search", "--per-page", "2"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta).toHaveProperty("totalJobAdCount");
    expect(data.meta).toHaveProperty("pageNumber");
    expect(data.meta).toHaveProperty("resultsPerPage");
    expect(data.meta.pageNumber).toBe(1);
    expect(data.meta.resultsPerPage).toBe(2);
  });

  test("facets have expected structure", async () => {
    const result = await runCLI(["search", "--per-page", "2"]);
    const data = parseJSON<SearchResponse>(result);

    expect(Array.isArray(data.facets.regions)).toBe(true);
    expect(Array.isArray(data.facets.workHours)).toBe(true);
    expect(Array.isArray(data.facets.employmentDurations)).toBe(true);
    expect(Array.isArray(data.facets.occupationAreas)).toBe(true);
    expect(Array.isArray(data.facets.countries)).toBe(true);

    if (data.facets.regions.length > 0) {
      expect(typeof data.facets.regions[0].type).toBe("string");
      expect(typeof data.facets.regions[0].jobAdCount).toBe("number");
    }
  });

  test("results have expected fields", async () => {
    const result = await runCLI(["search", "--per-page", "2"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    const item = data.results[0];

    expect(typeof item.jobAdId).toBe("string");
    // UUID format check
    expect(item.jobAdId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(typeof item.title).toBe("string");
    expect(item.title.length).toBeGreaterThan(0);
    expect(typeof item.hiringOrgName).toBe("string");
    expect(typeof item.country).toBe("string");
    expect(typeof item.publicationDate).toBe("string");
    expect(typeof item.workHourPartTime).toBe("boolean");
    expect(typeof item.isExternal).toBe("boolean");
    expect(typeof item.hasLogo).toBe("boolean");
    expect(typeof item.isSeen).toBe("boolean");
    expect(typeof item.isFavorite).toBe("boolean");
    expect(typeof item.workPlaceAddress).toBe("string");
  });

  test("filter by region (--region HovedstadenOgBornholm)", async () => {
    const result = await runCLI([
      "search",
      "--region",
      "HovedstadenOgBornholm",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("filter by work hours (--work-hours FullTime)", async () => {
    const result = await runCLI([
      "search",
      "--work-hours",
      "FullTime",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.workHourPartTime).toBe(false);
    }
  });

  test("filter by work hours (--work-hours PartTime)", async () => {
    const result = await runCLI([
      "search",
      "--work-hours",
      "PartTime",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    for (const item of data.results) {
      expect(item.workHourPartTime).toBe(true);
    }
  });

  test("search by keyword (--search-string sygeplejerske)", async () => {
    const result = await runCLI([
      "search",
      "--search-string",
      "sygeplejerske",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("pagination (--page 1 --per-page 3)", async () => {
    const result = await runCLI(["search", "--page", "1", "--per-page", "3"]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.pageNumber).toBe(1);
    expect(data.meta.resultsPerPage).toBe(3);
    expect(data.results.length).toBeLessThanOrEqual(3);
  });

  test("second page returns different results than first page", async () => {
    const page1 = await runCLI(["search", "--page", "1", "--per-page", "3"]);
    const page2 = await runCLI(["search", "--page", "2", "--per-page", "3"]);
    const data1 = parseJSON<SearchResponse>(page1);
    const data2 = parseJSON<SearchResponse>(page2);

    expect(data1.results.length).toBeGreaterThan(0);
    expect(data2.results.length).toBeGreaterThan(0);

    const ids1 = data1.results.map((r) => r.jobAdId);
    const ids2 = data2.results.map((r) => r.jobAdId);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });

  test("sort by PublicationDate (--order PublicationDate)", async () => {
    const result = await runCLI([
      "search",
      "--order",
      "PublicationDate",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    // Dates should be in descending order (newest first)
    const dates = data.results.map((r) => new Date(r.publicationDate).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  test("sort by ApplicationDate (--order ApplicationDate)", async () => {
    const result = await runCLI([
      "search",
      "--order",
      "ApplicationDate",
      "--per-page",
      "5",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.results.length).toBeGreaterThan(0);
    // Just verify it returns results without error; API-level ordering is trusted
    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
  });

  test("--limit caps results array", async () => {
    const result = await runCLI([
      "search",
      "--per-page",
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
      "--per-page",
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
      "--per-page",
      "3",
      "--format",
      "plain",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("postal code search (--postal-code 2100 --radius 10)", async () => {
    const result = await runCLI([
      "search",
      "--postal-code",
      "2100",
      "--radius",
      "10",
      "--per-page",
      "3",
    ]);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta.totalJobAdCount).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
  });
});
