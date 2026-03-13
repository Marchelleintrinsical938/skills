import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, formatPrice, getAddressStr } from "../helpers.js"

export const search = defineCommand({
  name: "search",
  description: "Search for-sale properties",
  options: {
    municipalities: option(z.string().optional(), {
      description: "Comma-separated municipality names",
    }),
    cities: option(z.string().optional(), {
      description: "Comma-separated city names",
    }),
    "zip-codes": option(z.string().optional(), {
      description: "Comma-separated zip codes",
    }),
    "address-types": option(z.string().optional(), {
      description: "Comma-separated property types",
    }),
    "min-price": option(z.coerce.number().optional(), {
      description: "Minimum asking price (DKK)",
    }),
    "max-price": option(z.coerce.number().optional(), {
      description: "Maximum asking price (DKK)",
    }),
    "min-area": option(z.coerce.number().optional(), {
      description: "Minimum living area (m²)",
    }),
    "max-area": option(z.coerce.number().optional(), {
      description: "Maximum living area (m²)",
    }),
    "min-rooms": option(z.coerce.number().optional(), {
      description: "Minimum number of rooms",
    }),
    "max-rooms": option(z.coerce.number().optional(), {
      description: "Maximum number of rooms",
    }),
    "sort-by": option(z.string().default("createdAt"), {
      description: "Sort field: price, timeOnMarket, random, createdAt, date",
    }),
    "sort-ascending": option(z.coerce.boolean().default(false), {
      description: "Sort ascending instead of descending",
    }),
    page: option(z.coerce.number().default(1), {
      description: "Page number (1-indexed)",
    }),
    "per-page": option(z.coerce.number().default(20), {
      description: "Results per page (max 100)",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap total results returned",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const params = new URLSearchParams()
    if (flags.municipalities) params.set("municipalities", flags.municipalities)
    if (flags.cities) params.set("cities", flags.cities)
    if (flags["zip-codes"]) params.set("zipCodes", flags["zip-codes"])
    if (flags["address-types"]) params.set("addressTypes", flags["address-types"])
    if (flags["min-price"] !== undefined) params.set("minPrice", String(flags["min-price"]))
    if (flags["max-price"] !== undefined) params.set("maxPrice", String(flags["max-price"]))
    if (flags["min-area"] !== undefined) params.set("minArea", String(flags["min-area"]))
    if (flags["max-area"] !== undefined) params.set("maxArea", String(flags["max-area"]))
    if (flags["min-rooms"] !== undefined) params.set("minRooms", String(flags["min-rooms"]))
    if (flags["max-rooms"] !== undefined) params.set("maxRooms", String(flags["max-rooms"]))
    // Map CLI sort values to API sort values
    // Note: createdAt and date both map to daysListed (the API's field for listing age)
    const sortMap: Record<string, string> = {
      price: "price",
      timeOnMarket: "timeOnMarket",
      random: "random",
      createdAt: "daysListed", // createdAt → daysListed (API field for listing age)
      date: "daysListed",      // date → daysListed (alias)
    }
    const apiSortBy = sortMap[flags["sort-by"]] ?? flags["sort-by"]
    params.set("sortBy", apiSortBy)
    params.set("sortAscending", String(flags["sort-ascending"]))
    params.set("page", String(flags.page))

    const perPage = flags.limit !== undefined ? Math.min(flags.limit, flags["per-page"]) : flags["per-page"]
    params.set("per_page", String(perPage))

    try {
      const response = await fetch(`${BASE_URL}/search/cases?${params.toString()}`)
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as { cases: unknown[]; totalHits: number }

      if (signal.aborted) return

      // Client-side filtering to ensure API filter params are respected
      let cases = data.cases as Record<string, unknown>[]
      if (flags["min-price"] !== undefined) cases = cases.filter(c => typeof c.priceCash !== "number" || c.priceCash >= flags["min-price"]!)
      if (flags["max-price"] !== undefined) cases = cases.filter(c => typeof c.priceCash !== "number" || c.priceCash <= flags["max-price"]!)
      if (flags["min-area"] !== undefined) cases = cases.filter(c => typeof c.housingArea !== "number" || c.housingArea >= flags["min-area"]!)
      if (flags["max-area"] !== undefined) cases = cases.filter(c => typeof c.housingArea !== "number" || c.housingArea <= flags["max-area"]!)
      if (flags["min-rooms"] !== undefined) cases = cases.filter(c => typeof c.numberOfRooms !== "number" || c.numberOfRooms >= flags["min-rooms"]!)
      if (flags["max-rooms"] !== undefined) cases = cases.filter(c => typeof c.numberOfRooms !== "number" || c.numberOfRooms <= flags["max-rooms"]!)

      const result = flags.limit !== undefined ? cases.slice(0, flags.limit) : cases

      if (flags.format === "json") {
        console.log(JSON.stringify({ cases: result, totalHits: data.totalHits }, null, 2))
      } else if (flags.format === "table") {
        outputTable(result)
      } else {
        outputPlain(result)
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err), code: "FETCH_ERROR" }) + "\n")
      process.exit(1)
    }
  },
})

function formatPriceOrDash(price: unknown): string {
  if (typeof price !== "number") return "-"
  return formatPrice(price)
}

function outputTable(cases: Record<string, unknown>[]): void {
  console.log("caseID                               address                              type    price        area   rooms  days")
  for (const c of cases) {
    const caseID = String(c.caseID ?? "-").padEnd(36)
    const addr = getAddressStr(c).substring(0, 36).padEnd(36)
    const type = String(c.addressType ?? "-").padEnd(7)
    const price = formatPriceOrDash(c.priceCash ?? (c.address as Record<string, unknown>)?.casePrice).padEnd(12)
    const area = String(c.housingArea !== undefined ? `${c.housingArea}m²` : "-").padEnd(6)
    const rooms = String(c.numberOfRooms ?? "-").padEnd(6)
    const days = String(c.daysOnMarket ?? "-")
    console.log(`${caseID} ${addr} ${type} ${price} ${area} ${rooms} ${days}`)
  }
}

function outputPlain(cases: Record<string, unknown>[]): void {
  for (const c of cases) {
    console.log(`caseID: ${c.caseID}`)
    console.log(`address: ${getAddressStr(c)}`)
    console.log(`type: ${c.addressType}`)
    console.log(`price: ${formatPriceOrDash(c.priceCash)} DKK`)
    console.log(`area: ${c.housingArea !== undefined ? `${c.housingArea} m²` : "-"}`)
    console.log(`rooms: ${c.numberOfRooms ?? "-"}`)
    console.log(`days on market: ${c.daysOnMarket ?? "-"}`)
    console.log("")
  }
}
