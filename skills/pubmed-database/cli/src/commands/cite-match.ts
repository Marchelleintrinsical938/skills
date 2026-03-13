import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { writeError } from "../helpers.js"

const USER_AGENT = "pubmed-cli/1.0 (https://github.com/user/skills; mailto:user@example.com)"
const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

export const citeMatch = defineCommand({
  name: "cite-match",
  description: "Find PMID from partial citation information (journal, year, volume, page, author)",
  options: {
    journal: option(z.string().optional(), {
      description: "Journal name or abbreviation",
    }),
    year: option(z.string().optional(), {
      description: "Publication year",
    }),
    volume: option(z.string().optional(), {
      description: "Volume number",
    }),
    page: option(z.string().optional(), {
      description: "First page number",
    }),
    author: option(z.string().optional(), {
      description: "Author last name (first author)",
    }),
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json (default) or plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    // At least one field must be provided
    if (!flags.journal && !flags.year && !flags.volume && !flags.page && !flags.author) {
      writeError("At least one of --journal, --year, --volume, --page, --author is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    // ECitMatch citation string format: journal|year|volume|page|author|key|
    const journal = flags.journal ?? ""
    const year = flags.year ?? ""
    const volume = flags.volume ?? ""
    const page = flags.page ?? ""
    const author = flags.author ?? ""
    const key = "key1"

    const bdata = `${journal}|${year}|${volume}|${page}|${author}|${key}|`

    const url = `${BASE_URL}/ecitmatch.cgi?db=pubmed&rettype=xml&bdata=${encodeURIComponent(bdata)}`

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      if (signal.aborted) return

      const text = await response.text()

      // ECitMatch returns lines like: journal|year|volume|page|author|key|PMID
      // or: journal|year|volume|page|author|key|NOT_FOUND
      const lines = text.trim().split("\n").filter((l) => l.trim().length > 0)
      const results: Array<{ citation: string; pmid: string | null; found: boolean }> = []

      for (const line of lines) {
        const parts = line.split("|")
        // format: journal|year|volume|page|author|key|result
        const resultValue = parts[6]?.trim() ?? ""
        const found = resultValue.length > 0 && !resultValue.startsWith("NOT_FOUND") && /^\d+$/.test(resultValue)
        results.push({
          citation: `${parts[0] ?? ""}|${parts[1] ?? ""}|${parts[2] ?? ""}|${parts[3] ?? ""}|${parts[4] ?? ""}`,
          pmid: found ? resultValue : null,
          found,
        })
      }

      if (flags.format === "json") {
        console.log(JSON.stringify({ results, rawResponse: text.trim() }, null, 2))
      } else {
        for (const r of results) {
          if (r.found && r.pmid) {
            console.log(`Found PMID: ${r.pmid}`)
            console.log(`Citation: ${r.citation}`)
          } else {
            console.log(`Not found for citation: ${r.citation}`)
          }
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
