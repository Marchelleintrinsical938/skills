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
  dist: number
  type?: string
}

interface CoordLocation {
  name: string
  lon: number
  lat: number
  type: string
  id?: string
  dist?: number
}

interface NearbyResponse {
  stopLocationOrCoordLocation?: Array<{
    StopLocation?: StopLocation
    CoordLocation?: CoordLocation
  }>
}

interface FormattedStop {
  id: string
  name: string
  lat: number
  lon: number
  dist: number
  type: string
}

export const nearby = defineCommand({
  name: "nearby",
  description: "Find nearby stops and stations",
  options: {
    lat: option(z.coerce.number(), {
      description: "Latitude (required)",
    }),
    lon: option(z.coerce.number(), {
      description: "Longitude (required)",
    }),
    radius: option(z.coerce.number().default(1000), {
      description: "Search radius in meters (default: 1000)",
    }),
    max: option(z.coerce.number().default(10), {
      description: "Max results (default: 10)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (isNaN(flags.lat)) {
      writeError("--lat is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    if (isNaN(flags.lon)) {
      writeError("--lon is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      const params: Record<string, string> = {
        originCoordLat: String(flags.lat),
        originCoordLong: String(flags.lon),
        maxDist: String(flags.radius),
        maxNo: String(flags.max),
      }

      const data = await apiFetch<NearbyResponse>("/location.nearbystops", params)

      if (signal.aborted) return

      const stops: FormattedStop[] = (data.stopLocationOrCoordLocation ?? []).map((entry) => {
        if (entry.StopLocation) {
          const s = entry.StopLocation
          return {
            id: s.extId ?? s.id,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            dist: s.dist ?? 0,
            type: "ST",
          }
        }
        const c = entry.CoordLocation!
        return {
          id: c.id ?? "",
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          dist: c.dist ?? 0,
          type: c.type === "ADR" ? "ADR" : "POI",
        }
      })

      const output = {
        type: "rejseplanen_nearby",
        lat: flags.lat,
        lon: flags.lon,
        radius: flags.radius,
        stops,
        count: stops.length,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("Name                            ID              Dist    Type")
        for (const s of stops) {
          const name = s.name.substring(0, 30).padEnd(32)
          const id = s.id.padEnd(15)
          const dist = `${s.dist}m`.padEnd(8)
          console.log(`${name} ${id} ${dist} ${s.type}`)
        }
      } else {
        for (const s of stops) {
          console.log(`${s.name} (${s.type})`)
          console.log(`  ID: ${s.id}  Distance: ${s.dist}m`)
          console.log(`  Coordinates: ${s.lat.toFixed(6)}, ${s.lon.toFixed(6)}`)
          console.log("")
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
