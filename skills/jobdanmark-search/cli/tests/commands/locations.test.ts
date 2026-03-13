import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface LocationItem {
  id: string;
  text: string;
  value: string;
  category: string;
  slug: string;
}

interface LocationGroup {
  title: string;
  items: LocationItem[];
}

describe("locations command", () => {
  test("returns an array of location groups for a city query", async () => {
    const result = await runCLI(["locations", "--query", "Odense"]);
    const data = parseJSON<LocationGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("each group has title and items array", async () => {
    const result = await runCLI(["locations", "--query", "Odense"]);
    const data = parseJSON<LocationGroup[]>(result);

    for (const group of data) {
      expect(group).toHaveProperty("title");
      expect(group).toHaveProperty("items");
      expect(typeof group.title).toBe("string");
      expect(Array.isArray(group.items)).toBe(true);
    }
  });

  test("items have expected fields with correct types", async () => {
    const result = await runCLI(["locations", "--query", "Odense"]);
    const data = parseJSON<LocationGroup[]>(result);

    const allItems = data.flatMap((g) => g.items);
    expect(allItems.length).toBeGreaterThan(0);

    const item = allItems[0];
    expect(typeof item.id).toBe("string");
    expect(typeof item.text).toBe("string");
    expect(typeof item.value).toBe("string");
    expect(typeof item.category).toBe("string");
    expect(typeof item.slug).toBe("string");
  });

  test("Odense query includes a municipality group", async () => {
    const result = await runCLI(["locations", "--query", "Odense"]);
    const data = parseJSON<LocationGroup[]>(result);

    const municipalityGroup = data.find((g) => g.title === "Kommune");
    expect(municipalityGroup).toBeDefined();
    expect(municipalityGroup!.items.length).toBeGreaterThan(0);

    const odenseItem = municipalityGroup!.items.find(
      (i) => i.text === "Odense" || i.value === "Odense"
    );
    expect(odenseItem).toBeDefined();
    expect(odenseItem!.category).toBe("municipality");
  });

  test("municipality item value is a string (display name)", async () => {
    const result = await runCLI(["locations", "--query", "Odense"]);
    const data = parseJSON<LocationGroup[]>(result);

    const allItems = data.flatMap((g) => g.items);
    const municipalityItems = allItems.filter((i) => i.category === "municipality");

    for (const item of municipalityItems) {
      // For municipalities, value is the display name (string)
      expect(typeof item.value).toBe("string");
    }
  });

  test("zip code query returns zip suggestions", async () => {
    const result = await runCLI(["locations", "--query", "8000"]);
    const data = parseJSON<LocationGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    const allItems = data.flatMap((g) => g.items);
    const zipItems = allItems.filter((i) => i.category === "zip");
    expect(zipItems.length).toBeGreaterThan(0);

    // Zip item id should follow pattern zip__XXXX
    for (const item of zipItems) {
      expect(item.id).toMatch(/^zip__\d+$/);
      // value is a numeric string for zip codes
      expect(item.value).toMatch(/^\d+$/);
    }
  });

  test("region query returns results", async () => {
    const result = await runCLI(["locations", "--query", "Sjælland"]);
    const data = parseJSON<LocationGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    // Should return something for a valid region
  });

  test("returns empty array for a query with no matches", async () => {
    const result = await runCLI(["locations", "--query", "zzznowherenotaplace99999"]);
    const data = parseJSON<LocationGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test("--limit caps total location items returned", async () => {
    const result = await runCLI(["locations", "--query", "Odense", "--limit", "1"]);
    const data = parseJSON<LocationGroup[]>(result);

    const totalItems = data.reduce((sum, g) => sum + g.items.length, 0);
    expect(totalItems).toBeLessThanOrEqual(1);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["locations", "--query", "Odense", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["locations", "--query", "Odense", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("missing --query returns error with exit code 1", async () => {
    const result = await runCLI(["locations"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
