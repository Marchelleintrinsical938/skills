import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, formatPrice, getAddressStr } from "../helpers.js"

export const detail = defineCommand({
  name: "detail",
  description: "Get full property detail by caseID",
  options: {
    format: option(z.enum(["json", "plain", "table"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, positional, signal }) => {
    if (signal.aborted) return

    const caseID = positional[0]
    if (!caseID) {
      process.stderr.write(JSON.stringify({ error: "caseID argument is required", code: "INVALID_PARAMS" }) + "\n")
      process.exit(1)
    }

    try {
      const response = await fetch(`${BASE_URL}/cases/${encodeURIComponent(caseID)}`)
      if (response.status === 404) {
        process.stderr.write(JSON.stringify({ error: "Case not found", code: "NOT_FOUND" }) + "\n")
        process.exit(1)
      }
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const raw = await response.json() as Record<string, unknown>

      if (signal.aborted) return

      // Ensure common fields are always present (null if not available)
      const data: Record<string, unknown> = {
        housingArea: null,
        numberOfRooms: null,
        yearBuilt: null,
        energyLabel: null,
        ...raw,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(data, null, 2))
      } else if (flags.format === "table") {
        outputTable(data)
      } else {
        outputPlain(data)
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err), code: "FETCH_ERROR" }) + "\n")
      process.exit(1)
    }
  },
})

function formatPriceDisplay(price: unknown): string {
  if (typeof price !== "number") return "-"
  return formatPrice(price) + " DKK"
}

function outputPlain(data: Record<string, unknown>): void {
  console.log(`caseID:        ${data.caseID}`)
  console.log(`address:       ${getAddressStr(data)}`)
  console.log(`type:          ${data.addressType ?? "-"}`)
  console.log(`price:         ${formatPriceDisplay(data.priceCash)}`)
  console.log(`area:          ${data.housingArea !== undefined ? `${data.housingArea} m²` : "-"}`)
  console.log(`rooms:         ${data.numberOfRooms ?? "-"}`)
  console.log(`built:         ${data.yearBuilt ?? "-"}`)
  console.log(`energy:        ${data.energyLabel ?? "-"}`)
  console.log(`days on market: ${data.daysOnMarket ?? "-"}`)
  const realtor = data.realtor as Record<string, unknown> | undefined
  console.log(`realtor:       ${realtor?.name ?? "-"}`)
}

function outputTable(data: Record<string, unknown>): void {
  console.log("field            value")
  console.log(`caseID           ${data.caseID}`)
  console.log(`address          ${getAddressStr(data)}`)
  console.log(`type             ${data.addressType ?? "-"}`)
  console.log(`price            ${typeof data.priceCash === "number" ? data.priceCash.toLocaleString("da-DK") : "-"}`)
  console.log(`area             ${data.housingArea !== undefined ? `${data.housingArea}m²` : "-"}`)
  console.log(`rooms            ${data.numberOfRooms ?? "-"}`)
  console.log(`built            ${data.yearBuilt ?? "-"}`)
  console.log(`energy           ${data.energyLabel ?? "-"}`)
  console.log(`days on market   ${data.daysOnMarket ?? "-"}`)
}
