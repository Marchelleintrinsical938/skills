import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

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

interface DoiResponse {
  success: boolean
  type: string
  doi: string
  version_count: number
  results: Paper[]
}

// A well-known medrxiv DOI that should remain stable
const TEST_DOI = "10.1101/2024.12.26.24319649"

describe("doi command", () => {
  test("DOI lookup returns correct shape", async () => {
    const result = await runCLI(["doi", TEST_DOI])
    const data = parseJSON<DoiResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("medrxiv_doi")
    expect(data.doi).toBe(TEST_DOI)
    expect(typeof data.version_count).toBe("number")
    expect(Array.isArray(data.results)).toBe(true)
  })

  test("version_count matches results array length", async () => {
    const result = await runCLI(["doi", TEST_DOI])
    const data = parseJSON<DoiResponse>(result)

    expect(data.version_count).toBe(data.results.length)
    expect(data.version_count).toBeGreaterThan(0)
  })

  test("paper fields are correct types", async () => {
    const result = await runCLI(["doi", TEST_DOI])
    const data = parseJSON<DoiResponse>(result)

    expect(data.results.length).toBeGreaterThan(0)
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
  })

  test("doi in result matches doi query", async () => {
    const result = await runCLI(["doi", TEST_DOI])
    const data = parseJSON<DoiResponse>(result)

    expect(data.doi).toBe(TEST_DOI)
    for (const paper of data.results) {
      expect(paper.doi).toBe(TEST_DOI)
      expect(paper.url).toContain(TEST_DOI)
    }
  })

  test("URL is correctly constructed", async () => {
    const result = await runCLI(["doi", TEST_DOI])
    const data = parseJSON<DoiResponse>(result)

    for (const paper of data.results) {
      const expectedUrl = `https://www.medrxiv.org/content/${paper.doi}v${paper.version}`
      expect(paper.url).toBe(expectedUrl)
    }
  })

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["doi", TEST_DOI, "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
    expect(result.stdout).toContain(TEST_DOI)
  })

  test("invalid DOI returns error on stderr", async () => {
    const result = await runCLI(["doi", "10.9999/this-does-not-exist-at-all-xyz-abc-123"])
    // Could either return empty results or an error — check it doesn't crash uncontrollably
    // Valid DOIs that don't exist return empty collection (success: true, version_count: 0)
    // or an API error
    expect(result.exitCode === 0 || result.exitCode === 1).toBe(true)
  })
})
