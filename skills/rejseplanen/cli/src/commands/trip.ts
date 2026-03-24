import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError, todayDate, nowTime, calcDelay, parseNotes } from "../helpers.js"
import type { ParsedNote } from "../helpers.js"

interface TripLegOriginDest {
  name: string
  type: string
  extId?: string
  date: string
  time: string
  rtDate?: string
  rtTime?: string
  track?: string
}

interface TripProduct {
  name: string
  line?: string
  catOutL?: string
}

interface JourneyDetailRef {
  ref: string
}

interface TripLeg {
  Origin: TripLegOriginDest
  Destination: TripLegOriginDest
  Product?: TripProduct[] | TripProduct
  JourneyDetailRef?: JourneyDetailRef
  direction?: string
  type: string
  cancelled?: boolean
  name?: string
  Notes?: { Note?: RawNote[] | RawNote }
}

interface RawNote {
  value?: string
  key?: string
  type?: string
}

interface FareParam {
  name: string
  value: string
}

interface FareItem {
  price: number
  cur: string
  param: FareParam[]
}

interface FareSetItem {
  fareSetDescription?: string
  fareItem: FareItem[]
}

interface TariffResult {
  fareSetItem?: FareSetItem[]
}

interface TripItem {
  LegList: {
    Leg: TripLeg[] | TripLeg
  }
  TariffResult?: TariffResult
}

interface TripResponse {
  Trip?: TripItem[] | TripItem
  scrB?: string
  scrF?: string
}

interface FormattedFare {
  passenger: string
  product: string
  class: string
  price: number
  currency: string
}

const PASSENGER_NAMES: Record<string, string> = {
  A: "Adult",
  C: "Child",
  P: "Pensioner",
  Y: "Youth",
  H: "Halvpris",
}

function extractFares(tariff: TariffResult | undefined): FormattedFare[] {
  if (!tariff?.fareSetItem) return []
  const fares: FormattedFare[] = []
  // Only take the first fareSet (single tickets), skip commuter passes
  const fareSet = tariff.fareSetItem[0]
  if (!fareSet) return []
  for (const item of fareSet.fareItem) {
    const params: Record<string, string> = {}
    for (const p of item.param) {
      params[p.name] = p.value
    }
    // Only include standard class fares for clarity
    if (params.class !== "S") continue
    const psgCode = params.psg ?? "?"
    fares.push({
      passenger: PASSENGER_NAMES[psgCode] ?? psgCode,
      product: params.prod_name ?? params.trf_name ?? "Ticket",
      class: "Standard",
      price: item.price / 100,
      currency: item.cur,
    })
  }
  return fares
}

interface LocationResponse {
  stopLocationOrCoordLocation?: Array<{
    StopLocation?: { extId: string; name: string; id: string }
    CoordLocation?: { id?: string; name: string }
  }>
}

/** Resolve a name to a stop extId via the location API */
async function resolveStopId(name: string): Promise<string> {
  const data = await apiFetch<LocationResponse>("/location.name", {
    input: name,
    maxNo: "1",
  })
  const loc = data.stopLocationOrCoordLocation?.[0]?.StopLocation
  if (!loc) {
    throw new Error(`Could not find stop matching "${name}"`)
  }
  return loc.extId
}

interface JourneyDetailStop {
  name: string
  extId?: string
  arrTime?: string | null
  depTime?: string | null
  arrDate?: string | null
  depDate?: string | null
  track?: string
  routeIdx?: number
}

interface JourneyDetailResponse {
  Stops?: {
    Stop?: JourneyDetailStop[] | JourneyDetailStop
  }
  JourneyDetail?: {
    Stops?: {
      Stop?: JourneyDetailStop[] | JourneyDetailStop
    }
  }
}

interface FormattedStop {
  name: string
  arrival: string | null
  departure: string | null
}

async function fetchJourneyDetail(ref: string): Promise<FormattedStop[]> {
  const data = await apiFetch<JourneyDetailResponse>("/journeyDetail", { id: ref })
  const rawStops = data.Stops?.Stop ?? data.JourneyDetail?.Stops?.Stop
  if (!rawStops) return []
  const stops = Array.isArray(rawStops) ? rawStops : [rawStops]
  return stops.map((s) => ({
    name: s.name,
    arrival: s.arrTime?.substring(0, 5) ?? null,
    departure: s.depTime?.substring(0, 5) ?? null,
  }))
}

interface FormattedLeg {
  name: string
  type: string
  origin: string
  destination: string
  departure: string
  arrival: string
  track: string | null
  direction: string | null
  cancelled: boolean
  rtDeparture: string | null
  rtArrival: string | null
  delayed: boolean
  delayMinutes: number
  notes: ParsedNote[]
  stops?: FormattedStop[]
}

interface FormattedTrip {
  origin: string
  destination: string
  departure: string
  arrival: string
  duration: string
  changes: number
  legs: FormattedLeg[]
  fares?: FormattedFare[]
}

function isStopId(value: string): boolean {
  return /^\d+$/.test(value)
}

function calcDuration(depTime: string, arrTime: string, depDate: string, arrDate: string): string {
  const [dh, dm] = depTime.split(":").map(Number)
  const [ah, am] = arrTime.split(":").map(Number)

  let depMinutes = dh * 60 + dm
  let arrMinutes = ah * 60 + am

  // Handle overnight trips
  if (depDate !== arrDate || arrMinutes < depMinutes) {
    arrMinutes += 24 * 60
  }

  const diff = arrMinutes - depMinutes
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  return `${hours}:${String(minutes).padStart(2, "0")}`
}

function formatLeg(leg: TripLeg): FormattedLeg {
  const product = Array.isArray(leg.Product) ? leg.Product[0] : leg.Product
  const isWalk = leg.type === "WALK" || leg.type === "TRSF"
  const depDelay = calcDelay(leg.Origin.time, leg.Origin.date, leg.Origin.rtTime, leg.Origin.rtDate)
  const notes = parseNotes(leg.Notes?.Note as any)
  return {
    name: isWalk ? "Walk" : (product?.name ?? leg.name ?? "Unknown"),
    type: isWalk ? "WALK" : (product?.catOutL?.trim() ?? leg.type ?? ""),
    origin: leg.Origin.name,
    destination: leg.Destination.name,
    departure: leg.Origin.time.substring(0, 5),
    arrival: leg.Destination.time.substring(0, 5),
    track: leg.Origin.track ?? null,
    direction: leg.direction ?? null,
    cancelled: leg.cancelled ?? false,
    rtDeparture: leg.Origin.rtTime?.substring(0, 5) ?? null,
    rtArrival: leg.Destination.rtTime?.substring(0, 5) ?? null,
    delayed: depDelay.delayed,
    delayMinutes: depDelay.delayMinutes,
    notes,
  }
}

export const trip = defineCommand({
  name: "trip",
  description: "Plan a journey between two locations",
  options: {
    origin: option(z.string(), {
      description: "Origin stop ID or name (required)",
    }),
    destination: option(z.string(), {
      description: "Destination stop ID or name (required)",
    }),
    via: option(z.string().optional(), {
      description: "Via stop ID or name",
    }),
    date: option(z.string().optional(), {
      description: "Travel date YYYY-MM-DD (default: today)",
    }),
    time: option(z.string().optional(), {
      description: "Travel time HH:MM (default: now)",
    }),
    "arrive-by": option(z.coerce.boolean().default(false), {
      description: "Search by arrival time",
    }),
    results: option(z.coerce.number().default(5), {
      description: "Number of trips 1-6 (default: 5)",
    }),
    "no-fares": option(z.coerce.boolean().default(false), {
      description: "Exclude fare/pricing information",
    }),
    stops: option(z.coerce.boolean().default(false), {
      description: "Show intermediate stops for each leg",
    }),
    scroll: option(z.string().optional(), {
      description: "Scroll token for pagination (scrollEarlier/scrollLater)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (!flags.origin) {
      writeError("--origin is required", "MISSING_REQUIRED")
      process.exit(1)
    }
    if (!flags.destination) {
      writeError("--destination is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    const date = flags.date ?? todayDate()
    const time = flags.time ?? nowTime()

    try {
      const params: Record<string, string> = {
        date,
        time,
        numF: String(flags.results),
      }

      // Resolve names to stop IDs if needed
      const originId = isStopId(flags.origin) ? flags.origin : await resolveStopId(flags.origin)
      const destId = isStopId(flags.destination) ? flags.destination : await resolveStopId(flags.destination)

      params.originExtId = originId
      params.destExtId = destId

      if (flags.via) {
        const viaId = isStopId(flags.via) ? flags.via : await resolveStopId(flags.via)
        params.viaExtId = viaId
      }

      if (flags["arrive-by"]) {
        params.searchForArrival = "1"
      }

      if (flags.scroll) {
        params.ctx = flags.scroll
      }

      const data = await apiFetch<TripResponse>("/trip", params)

      if (signal.aborted) return

      const rawTrips = data.Trip
        ? Array.isArray(data.Trip) ? data.Trip : [data.Trip]
        : []

      const trips: FormattedTrip[] = rawTrips.map((t) => {
        const legs = Array.isArray(t.LegList.Leg) ? t.LegList.Leg : [t.LegList.Leg]
        const formattedLegs = legs.map(formatLeg)
        const firstLeg = formattedLegs[0]
        const lastLeg = formattedLegs[formattedLegs.length - 1]
        const transitLegs = formattedLegs.filter((l) => l.type !== "WALK")

        const result: FormattedTrip = {
          origin: firstLeg.origin,
          destination: lastLeg.destination,
          departure: firstLeg.departure,
          arrival: lastLeg.arrival,
          duration: calcDuration(
            firstLeg.departure,
            lastLeg.arrival,
            legs[0].Origin.date,
            legs[legs.length - 1].Destination.date,
          ),
          changes: Math.max(0, transitLegs.length - 1),
          legs: formattedLegs,
        }

        if (!flags["no-fares"]) {
          result.fares = extractFares(t.TariffResult)
        }

        return result
      })

      // Fetch journey details for --stops
      if (flags.stops) {
        const fetches: Promise<void>[] = []
        for (const t of trips) {
          for (let i = 0; i < t.legs.length; i++) {
            const leg = t.legs[i]
            // Only fetch for non-walk legs that have a JourneyDetailRef
            if (leg.type !== "WALK") {
              const tripIdx = trips.indexOf(t)
              const rawTrip = rawTrips[tripIdx]
              const rawLegs = Array.isArray(rawTrip.LegList.Leg) ? rawTrip.LegList.Leg : [rawTrip.LegList.Leg]
              const rawL = rawLegs[i]
              if (rawL?.JourneyDetailRef?.ref) {
                const ref = rawL.JourneyDetailRef.ref
                fetches.push(
                  fetchJourneyDetail(ref).then((stops) => {
                    leg.stops = stops
                  })
                )
              }
            }
          }
        }
        await Promise.all(fetches)
      }

      const output: Record<string, unknown> = {
        type: "rejseplanen_trip",
        origin: flags.origin,
        destination: flags.destination,
        date,
        time,
        trips,
        tripCount: trips.length,
      }

      if (flags.via) {
        output.via = flags.via
      }

      if (data.scrB) {
        output.scrollEarlier = data.scrB
      }
      if (data.scrF) {
        output.scrollLater = data.scrF
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("Dep    Arr    Duration  Changes  Route")
        for (const t of trips) {
          const route = t.legs.map((l) => l.name).join(" → ")
          console.log(`${t.departure}  ${t.arrival}  ${t.duration.padEnd(9)} ${String(t.changes).padEnd(8)} ${route}`)
        }
      } else {
        for (const t of trips) {
          console.log(`${t.origin} → ${t.destination}`)
          console.log(`  Departure: ${t.departure}  Arrival: ${t.arrival}  Duration: ${t.duration}  Changes: ${t.changes}`)
          for (const l of t.legs) {
            const delay = l.delayed ? ` (+${l.delayMinutes} min)` : ""
            const rt = l.rtDeparture ? ` (real-time: ${l.rtDeparture}${delay})` : ""
            console.log(`  - ${l.name} ${l.departure}→${l.arrival}${rt} ${l.origin} → ${l.destination}`)
            if (l.notes.length > 0) {
              for (const n of l.notes) {
                console.log(`    [${n.type}] ${n.text}`)
              }
            }
            if (l.stops && l.stops.length > 0) {
              console.log("    Stops:")
              for (const s of l.stops) {
                const arr = s.arrival ?? "     "
                const dep = s.departure ?? "     "
                console.log(`      ${arr} ${dep} ${s.name}`)
              }
            }
          }
          if (t.fares && t.fares.length > 0) {
            console.log("  Fares:")
            for (const f of t.fares) {
              console.log(`    ${f.passenger}: ${f.price.toFixed(2)} ${f.currency} (${f.product})`)
            }
          }
          console.log("")
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
