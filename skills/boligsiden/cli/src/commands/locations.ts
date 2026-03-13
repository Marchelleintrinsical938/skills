import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL } from "../helpers.js"

export const locations = defineCommand({
  name: "locations",
  description: "Autocomplete location search",
  options: {
    text: option(z.string().optional(), {
      description: "Search query text",
    }),
    limit: option(z.coerce.number().default(10), {
      description: "Max results to return",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (!flags.text) {
      process.stderr.write(JSON.stringify({ error: "--text argument is required", code: "INVALID_PARAMS" }) + "\n")
      process.exit(1)
    }

    try {
      const params = new URLSearchParams()
      params.set("text", flags.text)

      const response = await fetch(`${BASE_URL}/search/locations/cases?${params.toString()}`)
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as Record<string, unknown[]>

      if (signal.aborted) return

      // Apply limit to each array
      const limited: Record<string, unknown[]> = {}
      for (const [key, arr] of Object.entries(data)) {
        if (Array.isArray(arr)) {
          limited[key] = arr.slice(0, flags.limit)
        } else {
          limited[key] = arr
        }
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(limited, null, 2))
      } else if (flags.format === "table") {
        outputTable(limited)
      } else {
        outputPlain(limited)
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err), code: "FETCH_ERROR" }) + "\n")
      process.exit(1)
    }
  },
})

function outputTable(data: Record<string, unknown[]>): void {
  console.log("type            name")
  for (const [type, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue
    for (const item of items) {
      const it = item as Record<string, unknown>
      console.log(`${type.padEnd(15)} ${it.name ?? "-"}`)
    }
  }
}

function outputPlain(data: Record<string, unknown[]>): void {
  for (const [type, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue
    for (const item of items) {
      const it = item as Record<string, unknown>
      const name = String(it.name ?? "-")
      const zip = it.zipCode ? ` (${it.zipCode})` : ""
      const muni = it.municipalityCode ? ` [${it.municipalityCode}]` : ""
      console.log(`${type}\t${name}${zip}${muni}`)
    }
  }
}
