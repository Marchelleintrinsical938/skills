import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, formatPrice, writeError } from "../helpers.js"

export const mostviewed = defineCommand({
  name: "mostviewed",
  description: "Top viewed active listings",
  options: {
    page: option(z.coerce.number().default(1), {
      description: "Page number",
    }),
    "page-size": option(z.coerce.number().default(25), {
      description: "Results per page",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap total results returned by CLI",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const params: Record<string, string> = {
      page: String(flags.page),
      pageSize: String(flags["page-size"]),
    }

    try {
      const data = await apiFetch<unknown[]>("/statistics/mostviewed", params)

      if (signal.aborted) return

      let results = data as Record<string, unknown>[]
      // Apply page-size client-side since the API may not respect it
      results = results.slice(0, flags["page-size"])
      if (flags.limit !== undefined) {
        results = results.slice(0, flags.limit)
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(results, null, 2))
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

function outputTable(results: Record<string, unknown>[]): void {
  console.log("id        title                                price        views  city")
  for (const r of results) {
    const id = String(r.id ?? "-").padEnd(9)
    const title = String(r.title ?? "-").substring(0, 36).padEnd(36)
    const price = typeof r.price === "number" ? formatPrice(r.price).padEnd(12) : "-".padEnd(12)
    const views = String(r.viewCount ?? "-").padEnd(6)
    const city = String(r.city ?? "-")
    console.log(`${id} ${title} ${price} ${views} ${city}`)
  }
}

function outputPlain(results: Record<string, unknown>[]): void {
  for (const r of results) {
    console.log(`id: ${r.id}`)
    console.log(`title: ${r.title}`)
    console.log(`address: ${r.adress}`)
    console.log(`price: ${typeof r.price === "number" ? formatPrice(r.price) : "-"} DKK`)
    console.log(`views: ${r.viewCount}`)
    console.log(`zip: ${r.zipCode}  city: ${r.city}`)
    console.log(`type: ${r.propertyTypeName}`)
    console.log("")
  }
}
