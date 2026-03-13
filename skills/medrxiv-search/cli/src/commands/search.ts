import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import {
  fetchAllPapers,
  formatDate,
  formatPaper,
  writeError,
  type FormattedPaper,
} from "../helpers.js"

export const search = defineCommand({
  name: "search",
  description: "Search preprints by keyword within a date range",
  options: {
    query: option(z.string(), {
      description: "Keywords to search (space-separated)",
    }),
    days: option(z.coerce.number().default(30), {
      description: "Number of days back to search",
    }),
    max: option(z.coerce.number().default(20), {
      description: "Maximum results to return",
    }),
    category: option(z.string().optional(), {
      description: "Filter by medRxiv category (exact match, case-insensitive)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (!flags.query) {
      writeError("--query is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    const dateTo = new Date()
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - flags.days)

    const dateFromStr = formatDate(dateFrom)
    const dateToStr = formatDate(dateTo)

    try {
      const allPapers = await fetchAllPapers(dateFromStr, dateToStr)

      if (signal.aborted) return

      // Client-side filter — API does not support keyword or category search natively
      let filtered = allPapers
      if (flags.category) {
        const cat = flags.category.toLowerCase()
        filtered = filtered.filter((p) => p.category?.toLowerCase() === cat)
      }

      const keywords = flags.query.split(/\s+/).filter(Boolean)

      const scored = filtered
        .map((p) => ({ paper: p, hits: matchesKeywords(p, keywords) }))
        .filter((x) => x.hits > 0)
        .sort((a, b) => b.hits - a.hits)
        .slice(0, flags.max)

      const results = scored.map((x) => formatPaper(x.paper))

      const output = {
        success: true,
        type: "medrxiv_search",
        query: flags.query,
        days: flags.days,
        date_range: { from: dateFromStr, to: dateToStr },
        total_fetched: allPapers.length,
        result_count: results.length,
        results,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        outputTable(results)
      } else {
        outputPlain(results)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function matchesKeywords(paper: { title: string; abstract: string }, keywords: string[]): number {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase()
  let hits = 0
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) hits++
  }
  return hits
}

function outputTable(results: FormattedPaper[]): void {
  console.log("doi                                    date        category                    title")
  for (const r of results) {
    const doi = r.doi.padEnd(38)
    const date = r.date.padEnd(11)
    const category = r.category.substring(0, 27).padEnd(27)
    const title = r.title.substring(0, 60)
    console.log(`${doi} ${date} ${category} ${title}`)
  }
}

function outputPlain(results: FormattedPaper[]): void {
  for (const r of results) {
    console.log(`doi: ${r.doi}`)
    console.log(`title: ${r.title}`)
    console.log(`date: ${r.date}  category: ${r.category}`)
    console.log(`authors: ${r.authors}`)
    console.log(`institution: ${r.institution}`)
    console.log(`published: ${r.published}`)
    console.log(`url: ${r.url}`)
    console.log(`abstract: ${r.abstract.substring(0, 300)}...`)
    console.log("")
  }
}
