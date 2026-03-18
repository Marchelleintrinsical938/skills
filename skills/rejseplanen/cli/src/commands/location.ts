import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

interface StopLocation {
  name: string
  extId: string
  lon: number
  lat: number
  weight: number
  id: string
}

interface CoordLocation {
  name: string
  lon: number
  lat: number
  type: string
  id?: string
}

interface LocationResponse {
  stopLocationOrCoordLocation?: Array<{
    StopLocation?: StopLocation
    CoordLocation?: CoordLocation
  }>
}

interface FormattedLocation {
  id: string
  name: string
  lat: number
  lon: number
  type: string
}

export const location = defineCommand({
  name: "location",
  description: "Search for stops, stations, and addresses",
  options: {
    query: option(z.string(), {
      description: "Search string (required)",
    }),
    max: option(z.coerce.number().default(10), {
      description: "Max results (default: 10)",
    }),
    type: option(z.enum(["S", "A", "P", "ALL"]).default("ALL"), {
      description: "Filter: S=stop, A=address, P=POI, ALL=all",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (!flags.query) {
      writeError("--query is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      const params: Record<string, string> = {
        input: flags.query,
        maxNo: String(flags.max),
      }
      if (flags.type !== "ALL") {
        params.type = flags.type
      }

      const data = await apiFetch<LocationResponse>("/location.name", params)

      if (signal.aborted) return

      const locations: FormattedLocation[] = (data.stopLocationOrCoordLocation ?? []).map((entry) => {
        if (entry.StopLocation) {
          const s = entry.StopLocation
          return {
            id: s.extId ?? s.id,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            type: "ST",
          }
        }
        const c = entry.CoordLocation!
        return {
          id: c.id ?? "",
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          type: c.type === "ADR" ? "ADR" : "POI",
        }
      })

      const output = {
        type: "rejseplanen_location",
        query: flags.query,
        locations,
        count: locations.length,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("ID              Name                                      Type  Lat        Lon")
        for (const l of locations) {
          const id = l.id.padEnd(15)
          const name = l.name.substring(0, 40).padEnd(42)
          const type = l.type.padEnd(5)
          console.log(`${id} ${name} ${type} ${l.lat.toFixed(6)}  ${l.lon.toFixed(6)}`)
        }
      } else {
        for (const l of locations) {
          console.log(`${l.name} (${l.type})`)
          console.log(`  ID: ${l.id}`)
          console.log(`  Coordinates: ${l.lat.toFixed(6)}, ${l.lon.toFixed(6)}`)
          console.log("")
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
