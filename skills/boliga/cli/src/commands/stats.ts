import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

export const stats = defineCommand({
  name: "stats",
  description: "Real-time market snapshot",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    try {
      const data = await apiFetch<Record<string, unknown>>("/frontpage/stats")

      if (signal.aborted) return

      if (flags.format === "json") {
        console.log(JSON.stringify(data, null, 2))
      } else {
        outputPlain(data)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function outputPlain(data: Record<string, unknown>): void {
  console.log(`Properties for sale: ${data.propertiesForSale}`)
  console.log(`New today: ${data.newToday}`)
  console.log(`Price drops today: ${data.priceDropToday}`)
  console.log(`New foreclosures today: ${data.newForeClosuresToday}`)
  console.log(`New self-sale 24h: ${data.newSelfsale24h}`)
  console.log(`More than other portals: ${data.moreThanOtherPortals}`)
  console.log(`Self-sale number: ${data.selfsaleNumber}`)
  console.log(`Discrete number: ${data.discreteNumber}`)
  console.log(`On the way number: ${data.onthewayNumber}`)
}
