import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, formatPrice, getAddressStr } from "../helpers.js"

export const rentals = defineCommand({
  name: "rentals",
  description: "Search rental properties",
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
      description: "Minimum monthly rent (DKK)",
    }),
    "max-price": option(z.coerce.number().optional(), {
      description: "Maximum monthly rent (DKK)",
    }),
    "min-area": option(z.coerce.number().optional(), {
      description: "Minimum area (m²)",
    }),
    "max-area": option(z.coerce.number().optional(), {
      description: "Maximum area (m²)",
    }),
    "min-rooms": option(z.coerce.number().optional(), {
      description: "Minimum rooms",
    }),
    "max-rooms": option(z.coerce.number().optional(), {
      description: "Maximum rooms",
    }),
    "sort-by": option(z.string().default("createdAt"), {
      description: "Sort field: price, timeOnMarket, createdAt, date",
    }),
    "sort-ascending": option(z.coerce.boolean().default(false), {
      description: "Sort ascending",
    }),
    page: option(z.coerce.number().default(1), {
      description: "Page number",
    }),
    "per-page": option(z.coerce.number().default(20), {
      description: "Results per page",
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
    // Map CLI sort values to rentals API sort values
    // Note: createdAt maps to the API's createdAt field (daysListed does not apply to rentals API)
    const sortMap: Record<string, string> = {
      price: "rent",
      rent: "rent",
      timeOnMarket: "createdAt",
      createdAt: "createdAt", // createdAt → API's createdAt (not daysListed — rentals API differs)
      date: "createdAt",
    }
    const apiSortBy = sortMap[flags["sort-by"]] ?? flags["sort-by"]
    params.set("sortBy", apiSortBy)
    params.set("sortAscending", String(flags["sort-ascending"]))
    params.set("page", String(flags.page))

    const perPage = flags.limit !== undefined ? Math.min(flags.limit, flags["per-page"]) : flags["per-page"]
    params.set("per_page", String(perPage))

    try {
      const response = await fetch(`${BASE_URL}/search/rentals?${params.toString()}`)
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as { cases: unknown[]; totalHits: number }

      if (signal.aborted) return

      const cases = flags.limit !== undefined ? data.cases.slice(0, flags.limit) : data.cases

      if (flags.format === "json") {
        console.log(JSON.stringify({ cases, totalHits: data.totalHits }, null, 2))
      } else if (flags.format === "table") {
        outputTable(cases as Record<string, unknown>[])
      } else {
        outputPlain(cases as Record<string, unknown>[])
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

function getRentalPrice(c: Record<string, unknown>): unknown {
  // monthlyExpense is the monthly rent field in the rentals API; fall back to priceCash
  return c.monthlyExpense !== undefined ? c.monthlyExpense : c.priceCash
}

function outputTable(cases: Record<string, unknown>[]): void {
  console.log("caseID                               address                              type    price        area   rooms  days")
  for (const c of cases) {
    const caseID = String(c.caseID ?? "-").padEnd(36)
    const addr = getAddressStr(c).substring(0, 36).padEnd(36)
    const type = String(c.addressType ?? "-").padEnd(7)
    const price = formatPriceOrDash(getRentalPrice(c)).padEnd(12)
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
    console.log(`price: ${formatPriceOrDash(getRentalPrice(c))} DKK/month`)
    console.log(`area: ${c.housingArea !== undefined ? `${c.housingArea} m²` : "-"}`)
    console.log(`rooms: ${c.numberOfRooms ?? "-"}`)
    console.log(`days on market: ${c.daysOnMarket ?? "-"}`)
    console.log("")
  }
}
