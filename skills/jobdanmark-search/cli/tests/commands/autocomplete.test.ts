import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface AutocompleteItem {
  id: string;
  text: string;
  value: number;
  category: string;
  slug: string;
}

interface AutocompleteGroup {
  title: string;
  items: AutocompleteItem[];
}

describe("autocomplete command", () => {
  test("returns an array of suggestion groups for a known query", async () => {
    const result = await runCLI(["autocomplete", "--query", "it"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    // "it" is a very common prefix — should have at least one group
    expect(data.length).toBeGreaterThan(0);
  });

  test("each group has title and items array", async () => {
    const result = await runCLI(["autocomplete", "--query", "sygeplejerske"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    for (const group of data) {
      expect(group).toHaveProperty("title");
      expect(group).toHaveProperty("items");
      expect(typeof group.title).toBe("string");
      expect(Array.isArray(group.items)).toBe(true);
    }
  });

  test("items have expected fields with correct types", async () => {
    const result = await runCLI(["autocomplete", "--query", "it"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    expect(data.length).toBeGreaterThan(0);
    const allItems = data.flatMap((g) => g.items);
    expect(allItems.length).toBeGreaterThan(0);

    const item = allItems[0];
    expect(typeof item.id).toBe("string");
    expect(typeof item.text).toBe("string");
    expect(typeof item.value).toBe("number");
    expect(typeof item.category).toBe("string");
    expect(typeof item.slug).toBe("string");
  });

  test("item id matches pattern <category>__<value>", async () => {
    const result = await runCLI(["autocomplete", "--query", "it"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    const allItems = data.flatMap((g) => g.items);
    expect(allItems.length).toBeGreaterThan(0);

    for (const item of allItems) {
      // id format: "title__454" or "category__227978"
      expect(item.id).toMatch(/^(title|category)__\d+$/);
      expect(item.category).toMatch(/^(jobtitle|category)$/);
    }
  });

  test("returns empty array for a query with no matches", async () => {
    const result = await runCLI(["autocomplete", "--query", "zzzzzzzzzzxxxxxnomatch999"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test("--limit caps total suggestions returned", async () => {
    const result = await runCLI(["autocomplete", "--query", "it", "--limit", "2"]);
    const data = parseJSON<AutocompleteGroup[]>(result);

    const totalItems = data.reduce((sum, g) => sum + g.items.length, 0);
    expect(totalItems).toBeLessThanOrEqual(2);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["autocomplete", "--query", "it", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["autocomplete", "--query", "it", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("missing --query returns error with exit code 1", async () => {
    const result = await runCLI(["autocomplete"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
