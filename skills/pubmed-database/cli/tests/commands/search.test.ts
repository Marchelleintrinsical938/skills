import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

interface SearchMeta {
  total: number
  returnedCount: number
  retstart: number
}

interface SearchResult {
  pmid: string
  title: string
  authors: string[]
  source: string
  pubDate: string
  doi: string | null
}

interface SearchResponse {
  meta: SearchMeta
  results: SearchResult[]
}

describe("search command", () => {
  test("basic search returns { meta, results } structure", async () => {
    const result = await runCLI(["search", "--query", "diabetes", "--max", "3"])
    const data = parseJSON<SearchResponse>(result)

    expect(data).toHaveProperty("meta")
    expect(data).toHaveProperty("results")
    expect(typeof data.meta.total).toBe("number")
    expect(typeof data.meta.returnedCount).toBe("number")
    expect(typeof data.meta.retstart).toBe("number")
    expect(data.meta.total).toBeGreaterThan(0)
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)
  })

  test("results have expected fields", async () => {
    const result = await runCLI(["search", "--query", "cancer", "--max", "2"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.results.length).toBeGreaterThan(0)
    const item = data.results[0]
    expect(typeof item.pmid).toBe("string")
    expect(typeof item.title).toBe("string")
    expect(Array.isArray(item.authors)).toBe(true)
    expect(typeof item.source).toBe("string")
    expect(typeof item.pubDate).toBe("string")
    // doi may be null or string
    expect(item.doi === null || typeof item.doi === "string").toBe(true)
  })

  test("--max controls number of results returned", async () => {
    const result = await runCLI(["search", "--query", "hypertension", "--max", "3"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.results.length).toBeLessThanOrEqual(3)
  })

  test("--start offsets results", async () => {
    const result1 = await runCLI(["search", "--query", "diabetes", "--max", "3", "--start", "0"])
    const result2 = await runCLI(["search", "--query", "diabetes", "--max", "3", "--start", "3"])
    const data1 = parseJSON<SearchResponse>(result1)
    const data2 = parseJSON<SearchResponse>(result2)

    expect(data1.results.length).toBeGreaterThan(0)
    expect(data2.results.length).toBeGreaterThan(0)
    const ids1 = data1.results.map((r) => r.pmid)
    const ids2 = data2.results.map((r) => r.pmid)
    const overlap = ids1.filter((id) => ids2.includes(id))
    expect(overlap.length).toBe(0)
  })

  test("--limit caps results array", async () => {
    const result = await runCLI(["search", "--query", "cancer", "--max", "10", "--limit", "2"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.results.length).toBeLessThanOrEqual(2)
  })

  test("sort by pub_date", async () => {
    const result = await runCLI(["search", "--query", "COVID-19", "--max", "3", "--sort", "pub_date"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.results.length).toBeGreaterThan(0)
  })

  test("--format table outputs without error", async () => {
    const result = await runCLI(["search", "--query", "aspirin", "--max", "2", "--format", "table"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["search", "--query", "aspirin", "--max", "2", "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })

  test("missing --query exits with error", async () => {
    const result = await runCLI(["search"])
    expect(result.exitCode).not.toBe(0)
  })

  test("query with no results returns empty results array", async () => {
    // Use an extremely specific query unlikely to match anything
    const result = await runCLI([
      "search",
      "--query",
      "xyzzy12345nonexistentterminpubmed[ti]",
      "--max",
      "5",
    ])
    const data = parseJSON<SearchResponse>(result)

    expect(data.meta.total).toBe(0)
    expect(data.results).toEqual([])
  })
})
