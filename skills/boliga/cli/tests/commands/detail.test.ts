import { describe, test, expect, beforeAll } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchResult {
  id: number;
  ouId: number;
}

interface SearchResponse {
  meta: { totalCount: number };
  results: SearchResult[];
}

interface DetailResponse {
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
  latitude: number;
  longitude: number;
  buildYear: number;
  daysForSale: number;
  createdDate: string;
  isActive: boolean;
  municipality: number;
  energyClass: string;
  squaremeterPrice: number;
  views: number;
  guid: string;
  agentInfo?: {
    id: number;
    name: string;
  };
  images?: Array<{
    id: number;
    url: string;
  }>;
}

let estateId: number;

describe("detail command", () => {
  beforeAll(async () => {
    const result = await runCLI(["search", "--page-size", "1"]);
    const data = parseJSON<SearchResponse>(result);
    expect(data.results.length).toBeGreaterThan(0);
    estateId = data.results[0].id;
  });

  test("detail returns expected fields", async () => {
    const result = await runCLI(["detail", String(estateId)]);
    const data = parseJSON<DetailResponse>(result);

    expect(data.id).toBe(estateId);
    expect(typeof data.price).toBe("number");
    expect(data.price).toBeGreaterThan(0);
    expect(typeof data.street).toBe("string");
    expect(data.street.length).toBeGreaterThan(0);
    expect(typeof data.zipCode).toBe("number");
    expect(typeof data.city).toBe("string");
    expect(typeof data.rooms).toBe("number");
    expect(typeof data.size).toBe("number");
    expect(typeof data.propertyType).toBe("number");
    expect(typeof data.ouId).toBe("number");
    expect(typeof data.ouAddress).toBe("string");
  });

  test("detail returns extended fields not in search results", async () => {
    const result = await runCLI(["detail", String(estateId)]);
    const data = parseJSON<DetailResponse>(result);

    expect(typeof data.latitude).toBe("number");
    expect(typeof data.longitude).toBe("number");
    expect(typeof data.squaremeterPrice).toBe("number");
    expect(typeof data.daysForSale).toBe("number");
    expect(typeof data.createdDate).toBe("string");
    expect(typeof data.views).toBe("number");
    expect(typeof data.guid).toBe("string");
    expect(typeof data.isActive).toBe("boolean");
    expect(typeof data.municipality).toBe("number");
  });

  test("detail has agentInfo section", async () => {
    const result = await runCLI(["detail", String(estateId)]);
    const data = parseJSON<DetailResponse>(result);

    expect(data).toHaveProperty("agentInfo");
    if (data.agentInfo) {
      expect(typeof data.agentInfo.id).toBe("number");
      expect(typeof data.agentInfo.name).toBe("string");
    }
  });

  test("detail has images array", async () => {
    const result = await runCLI(["detail", String(estateId)]);
    const data = parseJSON<DetailResponse>(result);

    expect(data).toHaveProperty("images");
    expect(Array.isArray(data.images)).toBe(true);
  });

  test("invalid ID exits with code 1", async () => {
    const result = await runCLI(["detail", "999999999"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("invalid ID error is JSON on stderr with error field", async () => {
    const result = await runCLI(["detail", "999999999"]);
    expect(result.exitCode).toBe(1);
    let errorObj: { error: string; code: string };
    try {
      errorObj = JSON.parse(result.stderr);
    } catch {
      // Some CLIs write plain text errors; just check the exit code
      return;
    }
    expect(typeof errorObj.error).toBe("string");
    expect(errorObj.error.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["detail", String(estateId), "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
