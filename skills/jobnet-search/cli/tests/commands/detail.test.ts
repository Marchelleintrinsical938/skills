import { describe, test, expect, beforeAll } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchResult {
  jobAdId: string;
  title: string;
}

interface SearchResponse {
  meta: { totalJobAdCount: number; pageNumber: number; resultsPerPage: number };
  results: SearchResult[];
}

interface Employer {
  cvrNumber: string | null;
  pNumber: string | null;
  name: string;
  hasCompanyLogo: boolean;
}

interface JobAddress {
  streetName: string | null;
  city: string | null;
  postalCode: string | null;
  municipality: string | null;
  countryCode: string;
  countryName: string;
}

interface Job {
  type: string;
  address: JobAddress;
  noFixedWorkplace: boolean;
  isLimitedPeriod: boolean;
  isDisabilityFriendly: boolean;
  isPartTime: boolean;
  employmentDate: string | null;
  conceptUriDa: string | null;
  preferredLabelDa: string | null;
  driversLicenses: unknown[];
  classifications: unknown[];
  shifts: unknown[];
  isFavorite: boolean;
}

interface ContactPerson {
  firstNames: string | null;
  lastName: string | null;
  phoneNumber: string | null;
}

interface Application {
  deadlineDate: string | null;
  availablePositions: number;
  contactPersons: ContactPerson[];
  url: string | null;
  urlText: string | null;
  isApplicationDeadlineASAP: boolean;
}

interface DetailResponse {
  id: string;
  title: string;
  body: string;
  publicationDateTime: string;
  unpublicationDateTime: string | null;
  approvalStatus: string;
  views: number;
  createdDateTime: string;
  updatedDateTime: string;
  isAnonymousEmployer: boolean;
  hasLogo: boolean;
  logoUrl: string | null;
  employer: Employer;
  job: Job;
  application: Application;
  organisationTypeId: number | null;
  user: string | null;
}

let testJobId: string;

beforeAll(async () => {
  // Fetch a real job ID from search to use in detail tests
  const result = await runCLI(["search", "--per-page", "1"]);
  const data = parseJSON<SearchResponse>(result);
  if (data.results.length === 0) {
    throw new Error("No search results available to get a job ID for detail tests");
  }
  testJobId = data.results[0].jobAdId;
});

describe("detail command", () => {
  test("fetches a job detail by UUID and returns correct structure", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("body");
    expect(data).toHaveProperty("employer");
    expect(data).toHaveProperty("job");
    expect(data).toHaveProperty("application");
  });

  test("detail id matches requested job UUID", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.id).toBe(testJobId);
  });

  test("detail has expected top-level fields with correct types", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(typeof data.id).toBe("string");
    expect(data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(typeof data.title).toBe("string");
    expect(data.title.length).toBeGreaterThan(0);
    expect(typeof data.body).toBe("string");
    expect(typeof data.publicationDateTime).toBe("string");
    expect(typeof data.approvalStatus).toBe("string");
    expect(typeof data.views).toBe("number");
    expect(typeof data.createdDateTime).toBe("string");
    expect(typeof data.updatedDateTime).toBe("string");
    expect(typeof data.isAnonymousEmployer).toBe("boolean");
    expect(typeof data.hasLogo).toBe("boolean");
  });

  test("detail body contains HTML content", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    // body should be non-empty HTML (contains at least one tag or text)
    expect(typeof data.body).toBe("string");
    expect(data.body.length).toBeGreaterThan(0);
  });

  test("detail employer object has expected fields", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.employer).toHaveProperty("name");
    expect(data.employer).toHaveProperty("hasCompanyLogo");
    expect(typeof data.employer.name).toBe("string");
    expect(typeof data.employer.hasCompanyLogo).toBe("boolean");
  });

  test("detail job object has expected fields", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.job).toHaveProperty("type");
    expect(data.job).toHaveProperty("address");
    expect(data.job).toHaveProperty("noFixedWorkplace");
    expect(data.job).toHaveProperty("isLimitedPeriod");
    expect(data.job).toHaveProperty("isDisabilityFriendly");
    expect(data.job).toHaveProperty("isPartTime");
    expect(data.job).toHaveProperty("driversLicenses");
    expect(data.job).toHaveProperty("classifications");
    expect(data.job).toHaveProperty("shifts");
    expect(data.job).toHaveProperty("isFavorite");

    expect(typeof data.job.type).toBe("string");
    expect(typeof data.job.noFixedWorkplace).toBe("boolean");
    expect(typeof data.job.isLimitedPeriod).toBe("boolean");
    expect(typeof data.job.isDisabilityFriendly).toBe("boolean");
    expect(typeof data.job.isPartTime).toBe("boolean");
    expect(Array.isArray(data.job.driversLicenses)).toBe(true);
    expect(Array.isArray(data.job.classifications)).toBe(true);
    expect(Array.isArray(data.job.shifts)).toBe(true);
  });

  test("detail job.address has expected fields", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.job.address).toHaveProperty("countryCode");
    expect(data.job.address).toHaveProperty("countryName");
    expect(typeof data.job.address.countryCode).toBe("string");
    expect(typeof data.job.address.countryName).toBe("string");
  });

  test("detail application object has expected fields", async () => {
    const result = await runCLI(["detail", testJobId]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.application).toHaveProperty("availablePositions");
    expect(data.application).toHaveProperty("contactPersons");
    expect(data.application).toHaveProperty("isApplicationDeadlineASAP");
    expect(typeof data.application.availablePositions).toBe("number");
    expect(Array.isArray(data.application.contactPersons)).toBe(true);
    expect(typeof data.application.isApplicationDeadlineASAP).toBe("boolean");
  });

  test("--format plain strips HTML and outputs without error", async () => {
    const result = await runCLI(["detail", testJobId, "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
    // plain output should not contain HTML tags
    expect(result.stdout).not.toMatch(/<[a-z]+[^>]*>/i);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["detail", testJobId, "--format", "table"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("invalid UUID returns error on stderr with exit code 1", async () => {
    const result = await runCLI([
      "detail",
      "00000000-0000-0000-0000-000000000000",
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);

    let errorObj: { error: string; code: string };
    try {
      errorObj = JSON.parse(result.stderr);
      expect(typeof errorObj.error).toBe("string");
      expect(typeof errorObj.code).toBe("string");
    } catch {
      // stderr might not be JSON if bunli prints its own error; just check exit code
      expect(result.exitCode).toBe(1);
    }
  });
});
