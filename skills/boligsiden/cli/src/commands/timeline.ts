import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL, formatPrice } from "../helpers.js"

export const timeline = defineCommand({
  name: "timeline",
  description: "Get price history for a listing",
  options: {
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
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
      const response = await fetch(`${BASE_URL}/cases/${encodeURIComponent(caseID)}/timeline`)
      if (response.status === 404) {
        process.stderr.write(JSON.stringify({ error: "Case not found", code: "NOT_FOUND" }) + "\n")
        process.exit(1)
      }
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as { timeline: Array<Record<string, unknown>> }

      if (signal.aborted) return

      if (flags.format === "json") {
        console.log(JSON.stringify(data, null, 2))
      } else if (flags.format === "table") {
        outputTable(data.timeline)
      } else {
        outputPlain(data.timeline)
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

function outputTable(events: Array<Record<string, unknown>>): void {
  console.log("at                        type       price")
  for (const e of events) {
    const at = String(e.at ?? "-").padEnd(25)
    const type = String(e.type ?? "-").padEnd(10)
    const price = formatPriceOrDash(e.price)
    console.log(`${at} ${type} ${price}`)
  }
}

function outputPlain(events: Array<Record<string, unknown>>): void {
  for (const e of events) {
    console.log(`at: ${e.at}  type: ${e.type}  price: ${formatPriceOrDash(e.price)}`)
  }
}
