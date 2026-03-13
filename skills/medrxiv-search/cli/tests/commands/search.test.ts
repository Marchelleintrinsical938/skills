import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

interface DateRange {
  from: string
  to: string
}

interface Paper {
  doi: string
  title: string
  authors: string
  author_corresponding: string
  institution: string
  date: string
  version: string
  category: string
  abstract: string
  published: string
  url: string
}

interface SearchResponse {
  success: boolean
  type: string
  query: string
  days: number
  date_range: DateRange
  total_fetched: number
  result_count: number
  results: Paper[]
}

describe("search command", () => {
  test("basic search returns correct shape", async () => {
    const result = await runCLI(["search", "--query", "cancer", "--days", "7", "--max", "5"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("medrxiv_search")
    expect(data.query).toBe("cancer")
    expect(data.days).toBe(7)
    expect(typeof data.total_fetched).toBe("number")
    expect(typeof data.result_count).toBe("number")
    expect(Array.isArray(data.results)).toBe(true)
  })

  test("date_range fields are present and correct format", async () => {
    const result = await runCLI(["search", "--query", "virus", "--days", "7", "--max", "3"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.date_range).toHaveProperty("from")
    expect(data.date_range).toHaveProperty("to")
    expect(data.date_range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(data.date_range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test("result papers have all expected fields", async () => {
    const result = await runCLI(["search", "--query", "COVID", "--days", "7", "--max", "3"])
    const data = parseJSON<SearchResponse>(result)

    if (data.results.length > 0) {
      const paper = data.results[0]
      expect(typeof paper.doi).toBe("string")
      expect(typeof paper.title).toBe("string")
      expect(typeof paper.authors).toBe("string")
      expect(typeof paper.author_corresponding).toBe("string")
      expect(typeof paper.institution).toBe("string")
      expect(typeof paper.date).toBe("string")
      expect(typeof paper.version).toBe("string")
      expect(typeof paper.category).toBe("string")
      expect(typeof paper.abstract).toBe("string")
      expect(typeof paper.published).toBe("string")
      expect(typeof paper.url).toBe("string")
      // URL should contain the doi
      expect(paper.url).toContain(paper.doi)
      expect(paper.url).toContain("medrxiv.org")
    }
  })

  test("--max caps the number of results", async () => {
    const result = await runCLI(["search", "--query", "cancer", "--days", "14", "--max", "3"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.results.length).toBeLessThanOrEqual(3)
    expect(data.result_count).toBeLessThanOrEqual(3)
    expect(data.result_count).toBe(data.results.length)
  })

  test("--days flag controls date range", async () => {
    const result = await runCLI(["search", "--query", "infection", "--days", "14", "--max", "5"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.days).toBe(14)
    const from = new Date(data.date_range.from)
    const to = new Date(data.date_range.to)
    const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(13)
    expect(diffDays).toBeLessThanOrEqual(15)
  })

  test("--category filter limits results to that category", async () => {
    const result = await runCLI([
      "search",
      "--query",
      "disease",
      "--days",
      "7",
      "--max",
      "10",
      "--category",
      "epidemiology",
    ])
    const data = parseJSON<SearchResponse>(result)

    for (const paper of data.results) {
      expect(paper.category.toLowerCase()).toBe("epidemiology")
    }
  })

  test("missing --query exits with error", async () => {
    const result = await runCLI(["search", "--days", "7"])
    expect(result.exitCode).toBe(1)
    // Either stderr has an error message or we got a non-zero exit
    expect(result.exitCode).not.toBe(0)
  })

  test("--format table outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--query",
      "cancer",
      "--days",
      "7",
      "--max",
      "3",
      "--format",
      "table",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })

  test("--format plain outputs without error", async () => {
    const result = await runCLI([
      "search",
      "--query",
      "cancer",
      "--days",
      "7",
      "--max",
      "3",
      "--format",
      "plain",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })
})
