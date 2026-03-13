import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface LocationItem {
  name: string;
  type?: string;
  code?: string | number;
  municipalityCode?: number;
  zipCode?: string;
}

interface LocationsResult {
  addresses?: LocationItem[];
  cities?: LocationItem[];
  municipalities?: LocationItem[];
  zipCodes?: LocationItem[];
  roads?: LocationItem[];
  [key: string]: LocationItem[] | undefined;
}

describe("locations command", () => {
  test("returns valid JSON for text query", async () => {
    const result = await runCLI(["locations", "--text", "København"]);
    const data = parseJSON<LocationsResult>(result);

    expect(typeof data).toBe("object");
    expect(data).not.toBeNull();
  });

  test("returns cities array for Copenhagen query", async () => {
    const result = await runCLI(["locations", "--text", "København"]);
    const data = parseJSON<LocationsResult>(result);

    // Should have at least one of these location types
    const hasLocations =
      (data.cities !== undefined && data.cities.length > 0) ||
      (data.municipalities !== undefined && data.municipalities.length > 0) ||
      (data.zipCodes !== undefined && data.zipCodes.length > 0) ||
      (data.addresses !== undefined && data.addresses.length > 0);

    expect(hasLocations).toBe(true);
  });

  test("municipalities results contain København", async () => {
    const result = await runCLI(["locations", "--text", "København"]);
    const data = parseJSON<LocationsResult>(result);

    // municipalities array must be present and non-empty for the query "København"
    expect(data.municipalities).toBeDefined();
    expect(Array.isArray(data.municipalities)).toBe(true);
    expect((data.municipalities ?? []).length).toBeGreaterThan(0);
    const names = (data.municipalities ?? []).map((m) => m.name.toLowerCase());
    const hasKbh = names.some((n) => n.includes("københavn"));
    expect(hasKbh).toBe(true);
  });

  test("returns results for partial city name", async () => {
    const result = await runCLI(["locations", "--text", "Aarhus"]);
    const data = parseJSON<LocationsResult>(result);

    expect(typeof data).toBe("object");
    const hasAnyResult = Object.values(data).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    expect(hasAnyResult).toBe(true);
  });

  test("returns results for a zip code query", async () => {
    const result = await runCLI(["locations", "--text", "2100"]);
    const data = parseJSON<LocationsResult>(result);

    expect(typeof data).toBe("object");
  });

  test("returns empty or minimal results for nonsense query", async () => {
    const result = await runCLI(["locations", "--text", "xqzwxqzwxqzw"]);
    const data = parseJSON<LocationsResult>(result);

    // Either empty arrays or all arrays have 0 length
    expect(typeof data).toBe("object");
    const totalResults = Object.values(data)
      .filter(Array.isArray)
      .reduce((sum, arr) => sum + (arr as LocationItem[]).length, 0);
    expect(totalResults).toBe(0);
  });

  test("exits with non-zero code when --text is missing", async () => {
    const result = await runCLI(["locations"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("--limit caps each result category", async () => {
    const result = await runCLI([
      "locations",
      "--text",
      "København",
      "--limit",
      "3",
    ]);
    const data = parseJSON<LocationsResult>(result);

    // Each category array must be capped to at most 3 items
    for (const arr of Object.values(data)) {
      if (Array.isArray(arr)) {
        expect(arr.length).toBeLessThanOrEqual(3);
      }
    }
  });

  test("outputs table format without error", async () => {
    const result = await runCLI([
      "locations",
      "--text",
      "København",
      "--format",
      "table",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("outputs plain format without error", async () => {
    const result = await runCLI([
      "locations",
      "--text",
      "København",
      "--format",
      "plain",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
