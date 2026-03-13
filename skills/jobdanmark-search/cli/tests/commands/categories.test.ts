import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface Category {
  id: number;
  title: string;
  helpText: string;
  count: number;
}

describe("categories command", () => {
  test("returns an array of categories", async () => {
    const result = await runCLI(["categories"]);
    const data = parseJSON<Category[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("each category has id, title, helpText, count fields", async () => {
    const result = await runCLI(["categories"]);
    const data = parseJSON<Category[]>(result);

    expect(data.length).toBeGreaterThan(0);
    for (const cat of data) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("title");
      expect(cat).toHaveProperty("helpText");
      expect(cat).toHaveProperty("count");
    }
  });

  test("fields have correct types", async () => {
    const result = await runCLI(["categories"]);
    const data = parseJSON<Category[]>(result);

    expect(data.length).toBeGreaterThan(0);
    const cat = data[0];
    expect(typeof cat.id).toBe("number");
    expect(typeof cat.title).toBe("string");
    expect(typeof cat.helpText).toBe("string");
    expect(typeof cat.count).toBe("number");
    expect(cat.count).toBeGreaterThanOrEqual(0);
  });

  test("includes known category IDs", async () => {
    const result = await runCLI(["categories"]);
    const data = parseJSON<Category[]>(result);

    const ids = data.map((c) => c.id);
    // Known fixed category IDs from the API
    expect(ids).toContain(227978); // IT, Ingeniør og Energi
    expect(ids).toContain(227972); // Pædagogik, Uddannelse og Forskning
  });

  test("IT category has correct title", async () => {
    const result = await runCLI(["categories"]);
    const data = parseJSON<Category[]>(result);

    const itCat = data.find((c) => c.id === 227978);
    expect(itCat).toBeDefined();
    expect(itCat?.title).toBe("IT, Ingeniør og Energi");
  });

  test("--limit caps number of categories returned", async () => {
    const result = await runCLI(["categories", "--limit", "3"]);
    const data = parseJSON<Category[]>(result);

    expect(data.length).toBeLessThanOrEqual(3);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["categories", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["categories", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
