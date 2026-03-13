import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import {
  apiFetch,
  formatStore,
  writeError,
  type FormattedStore,
  type StoreWithClearances,
} from "../helpers.js"

export const search = defineCommand({
  name: "search",
  description: "Find stores with food waste items nearby",
  options: {
    zip: option(z.string().optional(), {
      description: "Danish ZIP code (e.g. 8000)",
    }),
    lat: option(z.coerce.number().optional(), {
      description: "Latitude for geo search",
    }),
    lon: option(z.coerce.number().optional(), {
      description: "Longitude for geo search",
    }),
    radius: option(z.coerce.number().default(5), {
      description: "Search radius in km (default: 5, only for geo search)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const hasZip = Boolean(flags.zip)
    const hasGeo = flags.lat !== undefined && flags.lon !== undefined

    if (!hasZip && !hasGeo) {
      writeError("Must provide either --zip or both --lat and --lon", "MISSING_REQUIRED")
      process.exit(1)
    }

    if (!hasZip && flags.lat !== undefined && flags.lon === undefined) {
      writeError("--lon is required when --lat is provided", "MISSING_REQUIRED")
      process.exit(1)
    }

    if (!hasZip && flags.lat === undefined && flags.lon !== undefined) {
      writeError("--lat is required when --lon is provided", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      let params: Record<string, string>
      if (hasZip) {
        params = { zip: flags.zip! }
      } else {
        params = {
          geo: `${flags.lat},${flags.lon}`,
          radius: String(flags.radius),
        }
      }

      const stores = await apiFetch<StoreWithClearances[]>("/v1/food-waste/", params)

      if (signal.aborted) return

      const results = stores.map(formatStore)

      const output = {
        success: true,
        type: "salling_food_waste_search",
        query: hasZip ? { zip: flags.zip } : { lat: flags.lat, lon: flags.lon, radius: flags.radius },
        storeCount: results.length,
        stores: results,
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

function outputTable(results: FormattedStore[]): void {
  console.log("id                    brand        name                          items  address")
  for (const r of results) {
    const id = r.id.substring(0, 20).padEnd(21)
    const brand = r.brand.substring(0, 12).padEnd(13)
    const name = r.name.substring(0, 29).padEnd(30)
    const items = String(r.itemCount).padEnd(6)
    const address = r.address.substring(0, 50)
    console.log(`${id} ${brand} ${name} ${items} ${address}`)
  }
}

function outputPlain(results: FormattedStore[]): void {
  for (const r of results) {
    console.log(`id: ${r.id}`)
    console.log(`name: ${r.name} (${r.brand})`)
    console.log(`address: ${r.address}`)
    console.log(`items: ${r.itemCount}`)
    console.log("")
  }
}
