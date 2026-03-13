import { describe, test, expect, beforeAll } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface Address {
  municipality?: string;
  municipalityCode?: number;
  city?: string;
  zipCode?: string;
  road?: string;
  houseNumber?: string;
}

interface CaseDetail {
  caseID: string;
  slug?: string;
  priceCash?: number;
  perAreaPrice?: number;
  priceChangePercentage?: number;
  monthlyExpense?: number;
  downPayment?: number;
  grossMortgage?: number;
  netMortgage?: number;
  housingArea?: number;
  lotArea?: number;
  basementArea?: number;
  numberOfRooms?: number;
  yearBuilt?: number;
  energyLabel?: string;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasTerrace?: boolean;
  daysOnMarket?: number;
  address?: Address;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

interface SearchResult {
  cases: Array<{ caseID: string }>;
  totalHits: number;
}

let knownCaseID: string;

beforeAll(async () => {
  // Fetch a real caseID from search to use in detail tests
  const result = await runCLI(["search", "--per-page", "1"]);
  const data = parseJSON<SearchResult>(result);
  if (data.cases.length === 0) {
    throw new Error("No cases returned from search — cannot run detail tests");
  }
  knownCaseID = data.cases[0].caseID;
});

describe("detail command", () => {
  test("returns valid JSON for a known case", async () => {
    const result = await runCLI(["detail", knownCaseID]);
    const data = parseJSON<CaseDetail>(result);

    expect(data).toHaveProperty("caseID");
    expect(data.caseID).toBe(knownCaseID);
  });

  test("returned case has price fields", async () => {
    const result = await runCLI(["detail", knownCaseID]);
    const data = parseJSON<CaseDetail>(result);

    // At least one price-related field should be present
    const hasPriceField =
      data.priceCash !== undefined ||
      data.perAreaPrice !== undefined ||
      data.monthlyExpense !== undefined;
    expect(hasPriceField).toBe(true);
  });

  test("returned case has address field", async () => {
    const result = await runCLI(["detail", knownCaseID]);
    const data = parseJSON<CaseDetail>(result);

    expect(data).toHaveProperty("address");
    expect(typeof data.address).toBe("object");
  });

  test("returned case has size fields", async () => {
    const result = await runCLI(["detail", knownCaseID]);
    const data = parseJSON<CaseDetail>(result);

    const hasSizeField =
      data.housingArea !== undefined || data.numberOfRooms !== undefined;
    expect(hasSizeField).toBe(true);
  });

  test("exits with non-zero code for invalid caseID", async () => {
    const result = await runCLI(["detail", "invalid-case-id-000000"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("exits with non-zero code when caseID is missing", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("outputs table format without error", async () => {
    const result = await runCLI(["detail", knownCaseID, "--format", "table"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("outputs plain format without error", async () => {
    const result = await runCLI(["detail", knownCaseID, "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
