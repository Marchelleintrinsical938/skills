import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, parseJobCards, parseHitCount, writeError } from "../helpers.js"

interface SearchAPIResponse {
  result_list_box_html: string
  hitcount_html: string
}

export const search = defineCommand({
  name: "search",
  description: "Search for job listings on Jobindex.dk",
  options: {
    query: option(z.string().optional(), {
      short: "q",
      description: "Keyword search query (e.g. python, grafisk designer)",
    }),
    page: option(z.coerce.number().default(1), {
      description: "Page number (1-indexed)",
    }),
    jobage: option(z.coerce.number().default(9999), {
      description: "Max age of posting in days: 1, 7, 14, 30, or 9999 (all)",
    }),
    sort: option(z.string().default("score"), {
      description: "Sort order: score (relevance) or date (newest first)",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap total results returned by the CLI (client-side)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (!flags.query) {
      writeError("--query is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    if (signal.aborted) return

    const params: Record<string, string> = {
      q: flags.query,
      page: String(flags.page),
      jobage: String(flags.jobage),
      sort: flags.sort,
    }

    try {
      const data = await apiFetch<SearchAPIResponse>("/jobsoegning.json", params)

      if (signal.aborted) return

      const total = parseHitCount(data.hitcount_html ?? "")
      let results = parseJobCards(data.result_list_box_html ?? "")

      if (flags.limit !== undefined) {
        results = results.slice(0, flags.limit)
      }

      const output = {
        meta: {
          total,
          page: flags.page,
          perPage: 20,
        },
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

function outputTable(results: ReturnType<typeof parseJobCards>): void {
  console.log("id          title                                    company              location")
  for (const r of results) {
    const id = r.id.padEnd(11)
    const title = r.title.substring(0, 40).padEnd(40)
    const company = (r.company ?? "-").substring(0, 20).padEnd(20)
    const location = r.location ?? "-"
    console.log(`${id} ${title} ${company} ${location}`)
  }
}

function outputPlain(results: ReturnType<typeof parseJobCards>): void {
  for (const r of results) {
    console.log(`id: ${r.id}`)
    console.log(`title: ${r.title}`)
    console.log(`company: ${r.company ?? "-"}`)
    console.log(`location: ${r.location ?? "-"}`)
    console.log(`date: ${r.date ?? "-"}`)
    console.log(`url: ${r.url}`)
    if (r.description) console.log(`description: ${r.description}`)
    console.log("")
  }
}
