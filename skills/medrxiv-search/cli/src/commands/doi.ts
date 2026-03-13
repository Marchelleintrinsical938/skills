import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, apiFetch, formatPaper, writeError, type ApiPaper } from "../helpers.js"

interface DoiApiResponse {
  messages?: Array<{ status: string; total?: number }>
  collection?: ApiPaper[]
}

export const doi = defineCommand({
  name: "doi",
  description: "Look up a specific paper by DOI",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json, plain",
    }),
  },
  handler: async ({ positional, flags, signal }) => {
    if (signal.aborted) return

    const [doiArg] = positional
    if (!doiArg) {
      writeError("DOI is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      const url = `${BASE_URL}/${doiArg}/na/json`
      const data = await apiFetch<DoiApiResponse>(url)

      if (signal.aborted) return

      const papers = (data.collection ?? []).map(formatPaper)

      const output = {
        success: true,
        type: "medrxiv_doi",
        doi: doiArg,
        version_count: papers.length,
        results: papers,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else {
        console.log(`doi: ${output.doi}`)
        console.log(`version_count: ${output.version_count}`)
        for (const r of output.results) {
          console.log(`\nversion: ${r.version}`)
          console.log(`title: ${r.title}`)
          console.log(`date: ${r.date}  category: ${r.category}`)
          console.log(`authors: ${r.authors}`)
          console.log(`institution: ${r.institution}`)
          console.log(`published: ${r.published}`)
          console.log(`url: ${r.url}`)
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
