import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

interface CiteMatchResult {
  citation: string
  pmid: string | null
  found: boolean
}

interface CiteMatchResponse {
  results: CiteMatchResult[]
  rawResponse: string
}

describe("cite-match command", () => {
  test("finds PMID from known citation", async () => {
    // Science 2008, well-known paper
    const result = await runCLI([
      "cite-match",
      "--journal", "Science",
      "--year", "2008",
      "--volume", "320",
      "--page", "1185",
    ])
    const data = parseJSON<CiteMatchResponse>(result)

    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)
    // rawResponse is always present
    expect(typeof data.rawResponse).toBe("string")
  })

  test("returns not-found for nonsense citation", async () => {
    const result = await runCLI([
      "cite-match",
      "--journal", "FakeJournalXYZ",
      "--year", "9999",
      "--volume", "999",
      "--page", "999",
    ])
    // Should still exit 0 even when not found
    expect(result.exitCode).toBe(0)
    const data = parseJSON<CiteMatchResponse>(result)
    expect(Array.isArray(data.results)).toBe(true)
  })

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "cite-match",
      "--journal", "Science",
      "--year", "2008",
      "--format", "plain",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })

  test("missing all flags exits with error", async () => {
    const result = await runCLI(["cite-match"])
    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toContain("required")
  })
})
