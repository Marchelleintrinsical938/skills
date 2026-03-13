import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

export const suggestions = defineCommand({
  name: "suggestions",
  description: "Location autocomplete",
  options: {
    query: option(z.string().optional(), {
      description: "Search text (address, street, city, zip code) — required",
    }),
    "area-limit": option(z.coerce.number().default(10), {
      description: "Max number of area suggestions",
    }),
    "address-limit": option(z.coerce.number().default(10), {
      description: "Max number of address/listing suggestions",
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

    const params: Record<string, string> = {
      q: flags.query,
      areaLimit: String(flags["area-limit"]),
      addressLimit: String(flags["address-limit"]),
    }

    try {
      const data = await apiFetch<Record<string, unknown>>("/location/suggestions", params)

      if (signal.aborted) return

      if (flags.format === "json") {
        console.log(JSON.stringify(data, null, 2))
      } else if (flags.format === "table") {
        outputTable(data)
      } else {
        outputPlain(data)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function outputTable(data: Record<string, unknown>): void {
  const boligSuggestions = (data.boligSuggestions as Record<string, unknown>[]) ?? []
  const areaSuggestions = (data.areaSuggestions as Record<string, unknown>[]) ?? []

  if (areaSuggestions.length > 0) {
    console.log("Area Suggestions:")
    console.log("id        name                                 type")
    for (const a of areaSuggestions) {
      const id = String(a.id ?? "-").padEnd(9)
      const name = String(a.name ?? "-").substring(0, 36).padEnd(36)
      const type = String(a.type ?? "-")
      console.log(`${id} ${name} ${type}`)
    }
  }

  if (boligSuggestions.length > 0) {
    console.log("Property Suggestions:")
    console.log("id        street                               zip    city")
    for (const b of boligSuggestions) {
      const id = String(b.id ?? "-").padEnd(9)
      const street = String(b.street ?? "-").substring(0, 36).padEnd(36)
      const zip = String(b.zipCode ?? "-").padEnd(6)
      const city = String(b.city ?? "-")
      console.log(`${id} ${street} ${zip} ${city}`)
    }
  }
}

function outputPlain(data: Record<string, unknown>): void {
  const boligSuggestions = (data.boligSuggestions as Record<string, unknown>[]) ?? []
  const areaSuggestions = (data.areaSuggestions as Record<string, unknown>[]) ?? []

  console.log(`total property suggestions: ${data.boligSuggestionsTotalCount ?? 0}`)

  if (areaSuggestions.length > 0) {
    console.log("\nArea suggestions:")
    for (const a of areaSuggestions) {
      console.log(`  ${a.name} (id: ${a.id}, type: ${a.type})`)
    }
  }

  if (boligSuggestions.length > 0) {
    console.log("\nProperty suggestions:")
    for (const b of boligSuggestions) {
      console.log(`  ${b.street}, ${b.zipCode} ${b.city} (id: ${b.id})`)
    }
  }
}
