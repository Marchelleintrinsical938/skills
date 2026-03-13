import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, formatPrice, writeError } from "../helpers.js"

export const sold = defineCommand({
  name: "sold",
  description: "Search sold properties",
  options: {
    "zip-codes": option(z.string().optional(), {
      description: "Comma-separated zip codes",
    }),
    municipality: option(z.coerce.number().optional(), {
      description: "Municipality code",
    }),
    "property-type": option(z.coerce.number().optional(), {
      description: "Property type code (1–9)",
    }),
    "price-min": option(z.coerce.number().optional(), {
      description: "Minimum sold price in DKK",
    }),
    "price-max": option(z.coerce.number().optional(), {
      description: "Maximum sold price in DKK",
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
    sort: option(z.string().default("soldDate-d"), {
      description: "Sort order: soldDate-d, price-d, price-a, sqmPrice-d",
    }),
    page: option(z.coerce.number().default(1), {
      description: "Page number",
    }),
    "page-size": option(z.coerce.number().default(10), {
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

    const params: Record<string, string> = {}
    // NOTE: The sold API does not support zipCodes param - we do client-side filtering
    if (flags.municipality !== undefined) params["municipalityCode"] = String(flags.municipality)
    if (flags["property-type"] !== undefined) params["propertyType"] = String(flags["property-type"])
    if (flags["price-min"] !== undefined) params["priceMin"] = String(flags["price-min"])
    if (flags["price-max"] !== undefined) params["priceMax"] = String(flags["price-max"])
    if (flags["size-min"] !== undefined) params["sizeFrom"] = String(flags["size-min"])
    if (flags["size-max"] !== undefined) params["sizeTo"] = String(flags["size-max"])
    if (flags.rooms !== undefined) params["rooms"] = String(flags.rooms)
    if (flags["build-year-min"] !== undefined) params["buildYearMin"] = String(flags["build-year-min"])
    if (flags["build-year-max"] !== undefined) params["buildYearMax"] = String(flags["build-year-max"])
    // NOTE: soldDate-d is the default server-side; sending it causes HTTP 500
    if (flags.sort !== "soldDate-d") {
      params["sort"] = flags.sort
    }
    // When zip filtering client-side, paginate until we have enough matching results
    const zipFilter = flags["zip-codes"] ? flags["zip-codes"].split(",").map((z) => Number(z.trim())) : null
    const targetCount = flags.limit !== undefined ? Math.min(flags.limit, flags["page-size"]) : flags["page-size"]

    try {
      let results: Record<string, unknown>[] = []
      let lastMeta: unknown = null

      if (zipFilter && zipFilter.length > 0) {
        // Paginate through API results to collect enough zip-filtered results
        const fetchPageSize = 100
        params["pageSize"] = String(fetchPageSize)
        let currentPage = flags.page
        let totalPages = 999
        while (results.length < targetCount && currentPage <= Math.min(totalPages, 20)) {
          if (signal.aborted) return
          params["page"] = String(currentPage)
          const data = await apiFetch<{ meta: Record<string, unknown>; results: unknown[] }>("/sold/search/results", params)
          lastMeta = data.meta
          totalPages = (data.meta.totalPages as number) ?? totalPages
          const pageResults = (data.results as Record<string, unknown>[]).filter((r) =>
            zipFilter.includes(Number(r.zipCode))
          )
          results.push(...pageResults)
          currentPage++
          if (data.results.length === 0) break
        }
        results = results.slice(0, targetCount)
      } else {
        params["page"] = String(flags.page)
        params["pageSize"] = String(flags["page-size"])
        const data = await apiFetch<{ meta: unknown; results: unknown[] }>("/sold/search/results", params)
        lastMeta = data.meta
        results = data.results as Record<string, unknown>[]
        if (flags.limit !== undefined) {
          results = results.slice(0, flags.limit)
        }
      }

      if (signal.aborted) return

      const output = { meta: lastMeta, results }

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
  console.log("address                              zip    city               price        soldDate    type")
  for (const r of results) {
    const address = String(r.address ?? "-").substring(0, 36).padEnd(36)
    const zip = String(r.zipCode ?? "-").padEnd(6)
    const city = String(r.city ?? "-").substring(0, 18).padEnd(18)
    const price = typeof r.price === "number" ? formatPrice(r.price).padEnd(12) : "-".padEnd(12)
    const soldDate = typeof r.soldDate === "string" ? r.soldDate.substring(0, 10).padEnd(11) : "-".padEnd(11)
    const type = String(r.propertyType ?? "-")
    console.log(`${address} ${zip} ${city} ${price} ${soldDate} ${type}`)
  }
}

function outputPlain(results: Record<string, unknown>[]): void {
  for (const r of results) {
    console.log(`address: ${r.address}`)
    console.log(`zip: ${r.zipCode}  city: ${r.city}`)
    console.log(`price: ${typeof r.price === "number" ? formatPrice(r.price) : "-"} DKK`)
    console.log(`sold: ${r.soldDate ?? "-"}  type: ${r.saleType ?? "-"}`)
    console.log(`size: ${r.size !== undefined ? `${r.size} m²` : "-"}  rooms: ${r.rooms ?? "-"}`)
    console.log("")
  }
}
