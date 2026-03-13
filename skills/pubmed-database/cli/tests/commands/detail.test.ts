import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

interface DetailRecord {
  pmid: string
  title: string
  authors: string[]
  source: string
  fulljournalname: string
  pubDate: string
  sortPubDate: string
  volume: string
  issue: string
  pages: string
  doi: string | null
  pmc: string | null
  issn: string
  essn: string
  pubtype: string[]
  lang: string[]
  pmcRefCount: number
  attributes: string[]
  elocationid: string
}

const KNOWN_PMID = "20536893"

describe("detail command", () => {
  test("returns full record for known PMID", async () => {
    const result = await runCLI(["detail", KNOWN_PMID])
    const data = parseJSON<DetailRecord>(result)

    expect(data.pmid).toBe(KNOWN_PMID)
    expect(typeof data.title).toBe("string")
    expect(data.title.length).toBeGreaterThan(0)
    expect(Array.isArray(data.authors)).toBe(true)
    expect(typeof data.source).toBe("string")
    expect(typeof data.pubDate).toBe("string")
  })

  test("record has all expected fields", async () => {
    const result = await runCLI(["detail", KNOWN_PMID])
    const data = parseJSON<DetailRecord>(result)

    expect(data).toHaveProperty("pmid")
    expect(data).toHaveProperty("title")
    expect(data).toHaveProperty("authors")
    expect(data).toHaveProperty("source")
    expect(data).toHaveProperty("fulljournalname")
    expect(data).toHaveProperty("pubDate")
    expect(data).toHaveProperty("volume")
    expect(data).toHaveProperty("pages")
    expect(data).toHaveProperty("pubtype")
    expect(data).toHaveProperty("lang")
    expect(data).toHaveProperty("pmcRefCount")
  })

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["detail", KNOWN_PMID, "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("PMID:")
    expect(result.stdout).toContain("Title:")
  })

  test("missing PMID argument exits with error", async () => {
    const result = await runCLI(["detail"])
    expect(result.exitCode).not.toBe(0)
  })
})
