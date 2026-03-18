import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError, todayDate, nowTime, calcDelay, parseNotes } from "../helpers.js"
import type { ParsedNote } from "../helpers.js"

interface ProductInfo {
  name: string
  line?: string
  catOutL?: string
  displayNumber?: string
}

interface RawNote {
  value?: string
  key?: string
  type?: string
}

interface DepartureItem {
  name: string
  stop: string
  stopid: string
  stopExtId: string
  line?: string
  direction: string
  date: string
  time: string
  rtDate?: string
  rtTime?: string
  track?: string
  rtTrack?: string
  cancelled?: boolean
  Product?: ProductInfo[] | ProductInfo
  ProductAtStop?: ProductInfo
  Notes?: { Note?: RawNote[] | RawNote }
}

interface DepartureBoardResponse {
  DepartureBoard?: {
    Departure?: DepartureItem[] | DepartureItem
  }
  Departure?: DepartureItem[] | DepartureItem
}

interface FormattedDeparture {
  name: string
  line: string
  direction: string
  date: string
  time: string
  rtDate: string | null
  rtTime: string | null
  track: string | null
  cancelled: boolean
  stopId: string
  delayed: boolean
  delayMinutes: number
  notes: ParsedNote[]
}

function getProduct(d: DepartureItem): ProductInfo | undefined {
  if (d.ProductAtStop) return d.ProductAtStop
  if (d.Product) return Array.isArray(d.Product) ? d.Product[0] : d.Product
  return undefined
}

function formatDeparture(d: DepartureItem): FormattedDeparture {
  const product = getProduct(d)
  const delay = calcDelay(d.time, d.date, d.rtTime, d.rtDate)
  const notes = parseNotes(d.Notes?.Note as any)
  return {
    name: d.name ?? product?.name ?? "",
    line: d.line ?? product?.displayNumber ?? product?.line ?? product?.catOutL?.trim() ?? "",
    direction: d.direction ?? "",
    date: d.date,
    time: d.time.substring(0, 5),
    rtDate: d.rtDate ?? null,
    rtTime: d.rtTime?.substring(0, 5) ?? null,
    track: d.rtTrack ?? d.track ?? null,
    cancelled: d.cancelled ?? false,
    stopId: d.stopExtId ?? d.stopid ?? "",
    delayed: delay.delayed,
    delayMinutes: delay.delayMinutes,
    notes,
  }
}

export const departures = defineCommand({
  name: "departures",
  description: "Show upcoming departures from a stop",
  options: {
    stop: option(z.string(), {
      description: "Stop ID (required)",
    }),
    date: option(z.string().optional(), {
      description: "Date YYYY-MM-DD (default: today)",
    }),
    time: option(z.string().optional(), {
      description: "Time HH:MM (default: now)",
    }),
    duration: option(z.coerce.number().default(60), {
      description: "Time window in minutes 0-1439 (default: 60)",
    }),
    max: option(z.coerce.number().default(20), {
      description: "Max results (default: 20)",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    if (!flags.stop) {
      writeError("--stop is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    const date = flags.date ?? todayDate()
    const time = flags.time ?? nowTime()

    try {
      const params: Record<string, string> = {
        id: flags.stop,
        date,
        time,
        duration: String(flags.duration),
        maxJourneys: String(flags.max),
      }

      const data = await apiFetch<DepartureBoardResponse>("/departureBoard", params)

      if (signal.aborted) return

      const rawDepartures = data.DepartureBoard?.Departure ?? data.Departure
      const depArray = rawDepartures
        ? Array.isArray(rawDepartures) ? rawDepartures : [rawDepartures]
        : []

      const formattedDeps = depArray.map(formatDeparture)

      const output = {
        type: "rejseplanen_departures",
        stop: flags.stop,
        date,
        time,
        departures: formattedDeps,
        count: formattedDeps.length,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("Time   Name              Line      Direction                     Track")
        for (const d of formattedDeps) {
          const delayStr = d.delayed ? `(+${d.delayMinutes})` : ""
          const rt = d.rtTime && d.rtTime !== d.time ? `(${d.rtTime})` : ""
          const timeStr = `${d.time}${rt}${delayStr}`.padEnd(6)
          const name = d.name.substring(0, 17).padEnd(18)
          const line = d.line.substring(0, 9).padEnd(10)
          const dir = d.direction.substring(0, 29).padEnd(30)
          const track = d.track ?? ""
          console.log(`${timeStr} ${name} ${line} ${dir} ${track}`)
        }
      } else {
        for (const d of formattedDeps) {
          const delay = d.delayed ? ` (+${d.delayMinutes} min)` : ""
          const rt = d.rtTime ? ` (real-time: ${d.rtTime}${delay})` : ""
          const track = d.track ? ` [Track ${d.track}]` : ""
          const cancelled = d.cancelled ? " CANCELLED" : ""
          console.log(`${d.time}${rt} ${d.name} → ${d.direction}${track}${cancelled}`)
          if (d.notes.length > 0) {
            for (const n of d.notes) {
              console.log(`  [${n.type}] ${n.text}`)
            }
          }
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
