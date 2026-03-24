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

interface ArrivalItem {
  name: string
  stop: string
  stopid: string
  stopExtId: string
  line?: string
  origin?: string
  direction?: string
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

interface ArrivalBoardResponse {
  ArrivalBoard?: {
    Arrival?: ArrivalItem[] | ArrivalItem
  }
  Arrival?: ArrivalItem[] | ArrivalItem
}

interface FormattedArrival {
  name: string
  line: string
  origin: string
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

function getProduct(a: ArrivalItem): ProductInfo | undefined {
  if (a.ProductAtStop) return a.ProductAtStop
  if (a.Product) return Array.isArray(a.Product) ? a.Product[0] : a.Product
  return undefined
}

function formatArrival(a: ArrivalItem): FormattedArrival {
  const product = getProduct(a)
  const delay = calcDelay(a.time, a.date, a.rtTime, a.rtDate)
  const notes = parseNotes(a.Notes?.Note as any)
  return {
    name: a.name ?? product?.name ?? "",
    line: a.line ?? product?.displayNumber ?? product?.line ?? product?.catOutL?.trim() ?? "",
    origin: a.origin ?? a.direction ?? "",
    date: a.date,
    time: a.time.substring(0, 5),
    rtDate: a.rtDate ?? null,
    rtTime: a.rtTime?.substring(0, 5) ?? null,
    track: a.rtTrack ?? a.track ?? null,
    cancelled: a.cancelled ?? false,
    stopId: a.stopExtId ?? a.stopid ?? "",
    delayed: delay.delayed,
    delayMinutes: delay.delayMinutes,
    notes,
  }
}

export const arrivals = defineCommand({
  name: "arrivals",
  description: "Show upcoming arrivals at a stop",
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

      const data = await apiFetch<ArrivalBoardResponse>("/arrivalBoard", params)

      if (signal.aborted) return

      const rawArrivals = data.ArrivalBoard?.Arrival ?? data.Arrival
      const arrArray = rawArrivals
        ? Array.isArray(rawArrivals) ? rawArrivals : [rawArrivals]
        : []

      const formattedArrs = arrArray.map(formatArrival)

      const output = {
        type: "rejseplanen_arrivals",
        stop: flags.stop,
        date,
        time,
        arrivals: formattedArrs,
        count: formattedArrs.length,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("Time   Name              Line      Origin                        Track")
        for (const a of formattedArrs) {
          const delayStr = a.delayed ? `(+${a.delayMinutes})` : ""
          const rt = a.rtTime && a.rtTime !== a.time ? `(${a.rtTime})` : ""
          const timeStr = `${a.time}${rt}${delayStr}`.padEnd(6)
          const name = a.name.substring(0, 17).padEnd(18)
          const line = a.line.substring(0, 9).padEnd(10)
          const origin = a.origin.substring(0, 29).padEnd(30)
          const track = a.track ?? ""
          console.log(`${timeStr} ${name} ${line} ${origin} ${track}`)
        }
      } else {
        for (const a of formattedArrs) {
          const delay = a.delayed ? ` (+${a.delayMinutes} min)` : ""
          const rt = a.rtTime ? ` (real-time: ${a.rtTime}${delay})` : ""
          const track = a.track ? ` [Track ${a.track}]` : ""
          const cancelled = a.cancelled ? " CANCELLED" : ""
          console.log(`${a.time}${rt} ${a.name} from ${a.origin}${track}${cancelled}`)
          if (a.notes.length > 0) {
            for (const n of a.notes) {
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
