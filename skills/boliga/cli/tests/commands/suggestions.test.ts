import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface BoligSuggestion {
  id: number;
  street: string;
  zipCode: number;
  city: string;
  propertyType: number;
  ouId: number;
  unitId: string;
  ouAddress: string;
  useOuFlag: boolean;
}

interface AreaSuggestion {
  id: number;
  name: string;
  street: string | null;
  place: string | null;
  zipCode: string | null;
  municipality: string | null;
  region: string | null;
  areaId: number;
  type: number;
}

interface SuggestionsResponse {
  boligSuggestions: BoligSuggestion[];
  areaSuggestions: AreaSuggestion[];
  boligSuggestionsTotalCount: number;
  boligNFSSuggestions: unknown[];
  boligNFSSuggestionsTotalCount: number;
}

describe("suggestions command", () => {
  test('--query "København" returns suggestions', async () => {
    const result = await runCLI(["suggestions", "--query", "København"]);
    const data = parseJSON<SuggestionsResponse>(result);

    expect(data).toHaveProperty("boligSuggestions");
    expect(data).toHaveProperty("areaSuggestions");

    const hasResults =
      data.boligSuggestions.length > 0 || data.areaSuggestions.length > 0;
    expect(hasResults).toBe(true);
  });

  test("response has boligSuggestions and areaSuggestions arrays", async () => {
    const result = await runCLI(["suggestions", "--query", "København"]);
    const data = parseJSON<SuggestionsResponse>(result);

    expect(Array.isArray(data.boligSuggestions)).toBe(true);
    expect(Array.isArray(data.areaSuggestions)).toBe(true);
  });

  test("response has boligSuggestionsTotalCount", async () => {
    const result = await runCLI(["suggestions", "--query", "København"]);
    const data = parseJSON<SuggestionsResponse>(result);

    expect(typeof data.boligSuggestionsTotalCount).toBe("number");
  });

  test("areaSuggestions have expected fields", async () => {
    const result = await runCLI(["suggestions", "--query", "København"]);
    const data = parseJSON<SuggestionsResponse>(result);

    if (data.areaSuggestions.length > 0) {
      const area = data.areaSuggestions[0];
      expect(typeof area.id).toBe("number");
      expect(typeof area.name).toBe("string");
      expect(typeof area.type).toBe("number");
      expect(typeof area.areaId).toBe("number");
    }
  });

  test("boligSuggestions have expected fields when present", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "Kongshvilebakken",
    ]);
    const data = parseJSON<SuggestionsResponse>(result);

    if (data.boligSuggestions.length > 0) {
      const suggestion = data.boligSuggestions[0];
      expect(typeof suggestion.id).toBe("number");
      expect(typeof suggestion.street).toBe("string");
      expect(typeof suggestion.zipCode).toBe("number");
      expect(typeof suggestion.city).toBe("string");
      expect(typeof suggestion.propertyType).toBe("number");
      expect(typeof suggestion.ouId).toBe("number");
      expect(typeof suggestion.ouAddress).toBe("string");
    }
  });

  test("--area-limit limits area suggestions", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "København",
      "--area-limit",
      "2",
    ]);
    const data = parseJSON<SuggestionsResponse>(result);

    expect(data.areaSuggestions.length).toBeLessThanOrEqual(2);
  });

  test("--address-limit limits bolig suggestions", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "Kongshvilebakken",
      "--address-limit",
      "1",
    ]);
    const data = parseJSON<SuggestionsResponse>(result);

    expect(data.boligSuggestions.length).toBeLessThanOrEqual(1);
  });

  test("missing --query exits with error code 1", async () => {
    const result = await runCLI(["suggestions"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("missing --query error mentions query requirement", async () => {
    const result = await runCLI(["suggestions"]);
    expect(result.exitCode).toBe(1);
    // Error should reference missing query on stderr
    const errorText = result.stderr.toLowerCase();
    const mentionsQuery =
      errorText.includes("query") || errorText.includes("required");
    expect(mentionsQuery).toBe(true);
  });
});
