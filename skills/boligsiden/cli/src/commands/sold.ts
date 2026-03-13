import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, formatPrice, getAddressStr } from "../helpers.js"

export const sold = defineCommand({
  name: "sold",
  description: "Search sold properties",
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
    "sold-months-back": option(z.coerce.number().default(12), {
      description: "How many months back to include sales",
    }),
    radius: option(z.coerce.number().optional(), {
      description: "Search radius in metres",
    }),
    "min-price": option(z.coerce.number().optional(), {
      description: "Minimum sold price (DKK)",
    }),
    "max-price": option(z.coerce.number().optional(), {
      description: "Maximum sold price (DKK)",
    }),
    "min-area": option(z.coerce.number().optional(), {
      description: "Minimum area (m²)",
    }),
    "max-area": option(z.coerce.number().optional(), {
      description: "Maximum area (m²)",
    }),
    "sort-by": option(z.string().default("date"), {
      description: "Sort field: price, date, distance",
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
    params.set("sold", "true")
    if (flags.municipalities) params.set("municipalities", flags.municipalities)
    if (flags.cities) params.set("cities", flags.cities)
    if (flags["zip-codes"]) params.set("zipCodes", flags["zip-codes"])
    if (flags["address-types"]) params.set("addressTypes", flags["address-types"])
    params.set("soldMonthsBack", String(flags["sold-months-back"]))
    if (flags.radius !== undefined) params.set("radius", String(flags.radius))
    if (flags["min-price"] !== undefined) params.set("minPrice", String(flags["min-price"]))
    if (flags["max-price"] !== undefined) params.set("maxPrice", String(flags["max-price"]))
    if (flags["min-area"] !== undefined) params.set("minArea", String(flags["min-area"]))
    if (flags["max-area"] !== undefined) params.set("maxArea", String(flags["max-area"]))
    // Map CLI sort values to sold API sort values
    // Note: createdAt maps to soldDate (the API does not have a daysListed field for sold properties)
    const sortMap: Record<string, string> = {
      price: "soldPrice",
      date: "soldDate",
      distance: "distance",
      createdAt: "soldDate", // createdAt → soldDate (no daysListed on sold API)
    }
    const apiSortBy = sortMap[flags["sort-by"]] ?? flags["sort-by"]
    params.set("sortBy", apiSortBy)
    params.set("sortAscending", String(flags["sort-ascending"]))
    params.set("page", String(flags.page))

    const perPage = flags.limit !== undefined ? Math.min(flags.limit, flags["per-page"]) : flags["per-page"]
    params.set("per_page", String(perPage))

    try {
      const response = await fetch(`${BASE_URL}/search/addresses?${params.toString()}`)
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as { addresses: unknown[]; totalHits: number }

      if (signal.aborted) return

      // Client-side filtering to ensure API filter params are respected
      let addresses = data.addresses as Record<string, unknown>[]
      if (flags["min-price"] !== undefined) addresses = addresses.filter(c => {
        const p = getSoldPrice(c)
        return p === undefined || p >= flags["min-price"]!
      })
      if (flags["max-price"] !== undefined) addresses = addresses.filter(c => {
        const p = getSoldPrice(c)
        return p === undefined || p <= flags["max-price"]!
      })
      if (flags["min-area"] !== undefined) addresses = addresses.filter(c => typeof c.livingArea !== "number" || c.livingArea >= flags["min-area"]!)
      if (flags["max-area"] !== undefined) addresses = addresses.filter(c => typeof c.livingArea !== "number" || c.livingArea <= flags["max-area"]!)

      // Map addresses to cases for consistent interface
      const cases = flags.limit !== undefined ? addresses.slice(0, flags.limit) : addresses

      if (flags.format === "json") {
        console.log(JSON.stringify({ cases, totalHits: data.totalHits }, null, 2))
      } else if (flags.format === "table") {
        outputTable(cases)
      } else {
        outputPlain(cases)
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

function getSoldPrice(c: Record<string, unknown>): number | undefined {
  const regs = c.registrations as Array<Record<string, unknown>> | undefined
  if (regs && regs.length > 0) {
    const last = regs[regs.length - 1]
    return typeof last.amount === "number" ? last.amount : undefined
  }
  return typeof c.priceCash === "number" ? c.priceCash : undefined
}


function outputTable(cases: Record<string, unknown>[]): void {
  console.log("addressID                            address                              type    soldPrice    area")
  for (const c of cases) {
    const id = String(c.addressID ?? "-").padEnd(36)
    const addr = getAddressStr(c).substring(0, 36).padEnd(36)
    const type = String(c.addressType ?? "-").padEnd(7)
    const price = formatPriceOrDash(getSoldPrice(c)).padEnd(12)
    const area = String(c.livingArea !== undefined ? `${c.livingArea}m²` : "-")
    console.log(`${id} ${addr} ${type} ${price} ${area}`)
  }
}

function outputPlain(cases: Record<string, unknown>[]): void {
  for (const c of cases) {
    console.log(`addressID: ${c.addressID}`)
    console.log(`address: ${getAddressStr(c)}`)
    console.log(`type: ${c.addressType}`)
    console.log(`soldPrice: ${formatPriceOrDash(getSoldPrice(c))} DKK`)
    console.log(`area: ${c.livingArea !== undefined ? `${c.livingArea} m²` : "-"}`)
    console.log("")
  }
}
