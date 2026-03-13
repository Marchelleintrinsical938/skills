import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetchText, writeError } from "../helpers.js"

export const fetch_ = defineCommand({
  name: "fetch",
  description: "Fetch abstracts for given PMIDs (returns text)",
  options: {
    ids: option(z.string(), {
      description: "Comma-separated PMIDs (required), e.g. 12345678,23456789",
    }),
    format: option(z.enum(["text", "medline"]).default("text"), {
      description: "Output format: text (default) or medline",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const rettype = flags.format === "medline" ? "medline" : "abstract"

    try {
      const text = await apiFetchText("/efetch.fcgi", {
        db: "pubmed",
        id: flags.ids,
        rettype,
        retmode: "text",
      })

      if (signal.aborted) return

      console.log(text)
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
