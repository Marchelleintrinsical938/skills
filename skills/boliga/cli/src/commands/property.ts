import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

export const property = defineCommand({
  name: "property",
  description: "Comprehensive address data (BBR, history, valuations)",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json, plain",
    }),
  },
  handler: async ({ flags, positional, signal }) => {
    if (signal.aborted) return

    const [ouIdArg] = positional
    if (!ouIdArg) {
      writeError("ouId is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    const ouId = Number(ouIdArg)
    if (!Number.isInteger(ouId) || ouId <= 0) {
      writeError("Invalid ouId", "INVALID_ID")
      process.exit(1)
    }

    try {
      let data = await apiFetch<Record<string, unknown>>(`/oneurl/${ouId}`)

      if (signal.aborted) return

      // Check if it's a valid response
      if (!data || (!data.bbr && !data.estate)) {
        writeError("Property not found", "NOT_FOUND")
        process.exit(1)
      }

      // If sold is null, synthesize from estate data (active listings not yet sold)
      if (data.sold === null || data.sold === undefined) {
        const estateArr = data.estate as Record<string, unknown>[] | null
        const estate = estateArr && estateArr.length > 0 ? estateArr[0] : null
        if (estate) {
          data = {
            ...data,
            sold: {
              canGetVR: estate.canGetVR ?? false,
              userHasEvalReport: false,
              isActive: estate.isActive ?? true,
              currentEstateId: estate.id ?? 0,
              address: estate.street ?? "",
              addressObj: {
                street: estate.cleanStreet ?? estate.street ?? "",
                number: "",
                zipCode: estate.zipCode ?? 0,
              },
              zipCode: estate.zipCode ?? 0,
              city: estate.city ?? "",
              coordinates: {
                latitude: estate.latitude ?? 0,
                longitude: estate.longitude ?? 0,
              },
              guid: estate.guid ?? "",
              propertyType: estate.propertyType ?? 0,
              sales: [],
              previousListings: [],
              soldAgentInfo: null,
              ouId: estate.ouId ?? ouId,
              ouAddress: estate.ouAddress ?? "",
            },
          }
        }
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
  const bbr = data.bbr as Record<string, unknown> | undefined
  const sold = data.sold as Record<string, unknown> | undefined

  if (bbr) {
    console.log(`address: ${bbr.addressString}`)
    console.log(`property type: ${bbr.propertyTypeName} (${bbr.propertyType})`)
    console.log(`municipality: ${bbr.municipalityCode}`)
    console.log(`lat: ${bbr.lat}  lon: ${bbr.lon}`)
  }

  if (sold) {
    console.log(`current address: ${sold.address}`)
    console.log(`zip: ${sold.zipCode}  city: ${sold.city}`)
    console.log(`ouId: ${sold.ouId}`)
  }

  if (typeof data.lastListingPrice === "number") {
    console.log(`last listing price: ${data.lastListingPrice} DKK`)
  }
  if (typeof data.lastSalesPrice === "number") {
    console.log(`last sales price: ${data.lastSalesPrice} DKK`)
  }
  if (typeof data.squaremeterPriceAvg === "number") {
    console.log(`sqm price avg: ${data.squaremeterPriceAvg} DKK/m²`)
  }
}
