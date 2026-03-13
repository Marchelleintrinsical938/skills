import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, formatPrice, writeError } from "../helpers.js"

export const search = defineCommand({
  name: "search",
  description: "Search for-sale properties",
  options: {
    "zip-codes": option(z.string().optional(), {
      description: "Comma-separated zip codes, e.g. 2100,2200",
    }),
    municipality: option(z.coerce.number().optional(), {
      description: "Municipality code, e.g. 101 for Copenhagen",
    }),
    "property-type": option(z.coerce.number().optional(), {
      description: "Property type code (1–9)",
    }),
    "price-min": option(z.coerce.number().optional(), {
      description: "Minimum price in DKK",
    }),
    "price-max": option(z.coerce.number().optional(), {
      description: "Maximum price in DKK",
    }),
    "size-min": option(z.coerce.number().optional(), {
      description: "Minimum size in m²",
    }),
    "size-max": option(z.coerce.number().optional(), {
      description: "Maximum size in m²",
    }),
    rooms: option(z.coerce.number().optional(), {
      description: "Number of rooms",
    }),
    "build-year-min": option(z.coerce.number().optional(), {
      description: "Minimum build year",
    }),
    "build-year-max": option(z.coerce.number().optional(), {
      description: "Maximum build year",
    }),
    "energy-class": option(z.string().optional(), {
      description: "Comma-separated energy classes, e.g. a,b,c",
    }),
    sort: option(z.string().default("date-d"), {
      description: "Sort order: date-d, views-d, price-a, price-d, sqmPrice-a, sqmPrice-d, daysForSale-d",
    }),
    page: option(z.coerce.number().default(1), {
      description: "Page number",
    }),
    "page-size": option(z.coerce.number().default(10), {
      description: "Results per page (max ~100)",
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

    const params: Record<string, string> = {}
    if (flags["zip-codes"]) params["zipCodes"] = flags["zip-codes"]
    if (flags.municipality !== undefined) params["municipalityCode"] = String(flags.municipality)
    if (flags["property-type"] !== undefined) params["propertyType"] = String(flags["property-type"])
    if (flags["price-min"] !== undefined) params["priceMin"] = String(flags["price-min"])
    if (flags["price-max"] !== undefined) params["priceMax"] = String(flags["price-max"])
    if (flags["size-min"] !== undefined) params["sizeFrom"] = String(flags["size-min"])
    if (flags["size-max"] !== undefined) params["sizeTo"] = String(flags["size-max"])
    if (flags.rooms !== undefined) params["rooms"] = String(flags.rooms)
    if (flags["build-year-min"] !== undefined) params["buildYearMin"] = String(flags["build-year-min"])
    if (flags["build-year-max"] !== undefined) params["buildYearMax"] = String(flags["build-year-max"])
    if (flags["energy-class"]) params["energyClass"] = flags["energy-class"]
    params["sort"] = flags.sort
    params["page"] = String(flags.page)
    params["pageSize"] = String(flags["page-size"])

    try {
      const data = await apiFetch<{ meta: unknown; results: unknown[] }>("/search/results", params)

      if (signal.aborted) return

      let results = data.results as Record<string, unknown>[]
      if (flags.limit !== undefined) {
        results = results.slice(0, flags.limit)
      }

      const output = { meta: data.meta, results }

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

function outputTable(results: Record<string, unknown>[]): void {
  console.log("id        street                               zip    city               price        size  rooms")
  for (const r of results) {
    const id = String(r.id ?? "-").padEnd(9)
    const street = String(r.street ?? "-").substring(0, 36).padEnd(36)
    const zip = String(r.zipCode ?? "-").padEnd(6)
    const city = String(r.city ?? "-").substring(0, 18).padEnd(18)
    const price = typeof r.price === "number" ? formatPrice(r.price).padEnd(12) : "-".padEnd(12)
    const size = String(r.size !== undefined ? `${r.size}m²` : "-").padEnd(5)
    const rooms = String(r.rooms ?? "-")
    console.log(`${id} ${street} ${zip} ${city} ${price} ${size} ${rooms}`)
  }
}

function outputPlain(results: Record<string, unknown>[]): void {
  for (const r of results) {
    console.log(`id: ${r.id}`)
    console.log(`street: ${r.street}`)
    console.log(`zip: ${r.zipCode}  city: ${r.city}`)
    console.log(`price: ${typeof r.price === "number" ? formatPrice(r.price) : "-"} DKK`)
    console.log(`size: ${r.size !== undefined ? `${r.size} m²` : "-"}  rooms: ${r.rooms ?? "-"}`)
    console.log(`property type: ${r.propertyType ?? "-"}  days for sale: ${r.daysForSale ?? "-"}`)
    console.log("")
  }
}
