import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

export const detail = defineCommand({
  name: "detail",
  description: "Full detail for a single listing",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json, plain",
    }),
  },
  handler: async ({ flags, positional, signal }) => {
    if (signal.aborted) return

    const [idArg] = positional
    if (!idArg) {
      writeError("Estate ID is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    const id = Number(idArg)
    if (!Number.isInteger(id) || id <= 0) {
      writeError("Invalid estate ID", "INVALID_ID")
      process.exit(1)
    }

    try {
      const data = await apiFetch<Record<string, unknown>>(`/estate/${id}`)

      if (signal.aborted) return

      // Check if it's a valid response (has id field)
      if (!data || typeof data.id !== "number") {
        writeError("Property not found", "NOT_FOUND")
        process.exit(1)
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(data, null, 2))
      } else {
        outputPlain(data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("404") || message.includes("not found")) {
        writeError("Property not found", "NOT_FOUND")
      } else {
        writeError(message, "API_ERROR")
      }
      process.exit(1)
    }
  },
})

function outputPlain(data: Record<string, unknown>): void {
  console.log(`id: ${data.id}`)
  console.log(`street: ${data.street}`)
  console.log(`zip: ${data.zipCode}  city: ${data.city}`)
  console.log(`price: ${data.price} DKK`)
  console.log(`size: ${data.size} m²  rooms: ${data.rooms}`)
  console.log(`build year: ${data.buildYear}  energy: ${data.energyClass}`)
  console.log(`property type: ${data.propertyType}  days for sale: ${data.daysForSale}`)
  console.log(`municipality: ${data.municipality}`)
  console.log(`ouId: ${data.ouId}  ouAddress: ${data.ouAddress}`)
  if (data.agentInfo && typeof data.agentInfo === "object") {
    const agent = data.agentInfo as Record<string, unknown>
    console.log(`agent: ${agent.name} (id: ${agent.id})`)
  }
}
