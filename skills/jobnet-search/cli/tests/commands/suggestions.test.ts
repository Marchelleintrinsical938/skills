import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

describe("suggestions command", () => {
  test("returns array of strings for a Danish query", async () => {
    const result = await runCLI(["suggestions", "--query", "syge"]);
    const data = parseJSON<string[]>(result);

    expect(Array.isArray(data)).toBe(true);
    // Danish job title queries should return suggestions
    expect(data.length).toBeGreaterThan(0);
  });

  test("each suggestion is a string", async () => {
    const result = await runCLI(["suggestions", "--query", "syge"]);
    const data = parseJSON<string[]>(result);

    for (const suggestion of data) {
      expect(typeof suggestion).toBe("string");
      expect(suggestion.length).toBeGreaterThan(0);
    }
  });

  test("--limit caps the number of suggestions", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "lærer",
      "--limit",
      "3",
    ]);
    const data = parseJSON<string[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
  });

  test("different queries return different suggestions", async () => {
    const result1 = await runCLI(["suggestions", "--query", "syge"]);
    const result2 = await runCLI(["suggestions", "--query", "ingeniør"]);
    const data1 = parseJSON<string[]>(result1);
    const data2 = parseJSON<string[]>(result2);

    // Results should not be identical
    expect(JSON.stringify(data1)).not.toBe(JSON.stringify(data2));
  });

  test("English term may return empty array (no error)", async () => {
    const result = await runCLI(["suggestions", "--query", "developer"]);
    // Should exit cleanly even if results are empty
    expect(result.exitCode).toBe(0);
    const data = parseJSON<string[]>(result);
    expect(Array.isArray(data)).toBe(true);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "syge",
      "--format",
      "table",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "suggestions",
      "--query",
      "syge",
      "--format",
      "plain",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("missing --query returns error on stderr with exit code 1", async () => {
    const result = await runCLI(["suggestions"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});
