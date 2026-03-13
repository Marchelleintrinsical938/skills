import { describe, test, expect, beforeAll } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface SearchResult {
  id: number;
  ouId: number;
  ouAddress: string;
}

interface SearchResponse {
  meta: { totalCount: number };
  results: SearchResult[];
}

interface BbrData {
  unitId: string;
  isActive: boolean;
  addressString: string;
  gadeString: string;
  zipString: string;
  propertyType: number;
  municipalityCode: number;
  lat: number;
  lon: number;
  propertyTypeName: string;
}

interface SoldData {
  address: string;
  zipCode: number;
  city: string;
  propertyType: number;
  ouId: number;
  ouAddress: string;
  guid: string;
}

interface PropertyResponse {
  estate: unknown[];
  bbr: BbrData;
  sold: SoldData;
  ouIsFavorite: boolean;
  squaremeterPriceAvg?: number;
  discountAvg?: number;
}

let ouId: number;

describe("property command", () => {
  beforeAll(async () => {
    const result = await runCLI(["search", "--page-size", "1"]);
    const data = parseJSON<SearchResponse>(result);
    expect(data.results.length).toBeGreaterThan(0);
    ouId = data.results[0].ouId;
  });

  test("property returns estate, bbr, sold sections", async () => {
    const result = await runCLI(["property", String(ouId)]);
    const data = parseJSON<PropertyResponse>(result);

    expect(data).toHaveProperty("estate");
    expect(data).toHaveProperty("bbr");
    expect(data).toHaveProperty("sold");
    expect(Array.isArray(data.estate)).toBe(true);
  });

  test("bbr section has expected fields", async () => {
    const result = await runCLI(["property", String(ouId)]);
    const data = parseJSON<PropertyResponse>(result);

    const bbr = data.bbr;
    expect(bbr).toBeDefined();
    expect(typeof bbr.addressString).toBe("string");
    expect(bbr.addressString.length).toBeGreaterThan(0);
    expect(typeof bbr.gadeString).toBe("string");
    expect(typeof bbr.zipString).toBe("string");
    expect(typeof bbr.propertyType).toBe("number");
    expect(typeof bbr.municipalityCode).toBe("number");
    expect(typeof bbr.lat).toBe("number");
    expect(typeof bbr.lon).toBe("number");
    expect(typeof bbr.propertyTypeName).toBe("string");
  });

  test("sold section has expected fields", async () => {
    const result = await runCLI(["property", String(ouId)]);
    const data = parseJSON<PropertyResponse>(result);

    const sold = data.sold;
    expect(sold).toBeDefined();
    expect(typeof sold.address).toBe("string");
    expect(typeof sold.zipCode).toBe("number");
    expect(typeof sold.city).toBe("string");
    expect(typeof sold.propertyType).toBe("number");
    expect(typeof sold.ouId).toBe("number");
    expect(sold.ouId).toBe(ouId);
    expect(typeof sold.ouAddress).toBe("string");
    expect(typeof sold.guid).toBe("string");
  });

  test("property has ouIsFavorite field", async () => {
    const result = await runCLI(["property", String(ouId)]);
    const data = parseJSON<PropertyResponse>(result);

    expect(typeof data.ouIsFavorite).toBe("boolean");
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["property", String(ouId), "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("invalid ouId exits with code 1", async () => {
    const result = await runCLI(["property", "0"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
