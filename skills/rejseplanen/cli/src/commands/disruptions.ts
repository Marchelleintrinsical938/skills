import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError, todayDate, nowTime } from "../helpers.js"

interface StopLocation {
  name: string
  extId: string
}

interface Line {
  name: string
  lineId: string
}

interface HimMessage {
  id: string
  act: boolean
  head: string
  text: string
  lead?: string
  priority: number
  sDate: string
  sTime: string
  eDate: string
  eTime: string
  affectedStops?: {
    StopLocation: StopLocation[] | StopLocation
  }
  affectedLines?: {
    Line: Line[] | Line
  }
}

interface HimResponse {
  him?: {
    message?: HimMessage[] | HimMessage
  }
}

interface FormattedDisruption {
  id: string
  subject: string
  message: string
  priority: number
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  affectedStops: string[]
  affectedLines: string[]
}

function normalizeArray<T>(items: T[] | T | undefined): T[] {
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

function formatDisruption(msg: HimMessage): FormattedDisruption {
  const stops = normalizeArray(msg.affectedStops?.StopLocation).map(s => s.name)
  const lines = normalizeArray(msg.affectedLines?.Line).map(l => l.name)

  return {
    id: msg.id,
    subject: msg.head,
    message: msg.text,
    priority: msg.priority,
    startDate: msg.sDate,
    startTime: msg.sTime.substring(0, 5),
    endDate: msg.eDate,
    endTime: msg.eTime.substring(0, 5),
    affectedStops: stops,
    affectedLines: lines,
  }
}

export const disruptions = defineCommand({
  name: "disruptions",
  description: "Show current service disruptions and alerts",
  options: {
    stop: option(z.string().optional(), {
      description: "Stop ID to filter by",
    }),
    line: option(z.string().optional(), {
      description: "Line ID to filter by",
    }),
    date: option(z.string().optional(), {
      description: "Date YYYY-MM-DD (default: today)",
    }),
    time: option(z.string().optional(), {
      description: "Time HH:MM (default: now)",
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

    const date = flags.date ?? todayDate()
    const time = flags.time ?? nowTime()

    try {
      const params: Record<string, string> = {
        dateB: date,
        dateE: date,
        timeB: time,
        timeE: time,
        maxNum: String(flags.max),
      }

      if (flags.stop) {
        params.stationId = flags.stop
      }
      if (flags.line) {
        params.lineId = flags.line
      }

      const data = await apiFetch<HimResponse>("/himSearch", params)

      if (signal.aborted) return

      const rawMessages = data.him?.message
      const msgArray = rawMessages
        ? Array.isArray(rawMessages) ? rawMessages : [rawMessages]
        : []

      const formatted = msgArray.map(formatDisruption)

      const output = {
        type: "rejseplanen_disruptions",
        date,
        disruptions: formatted,
        count: formatted.length,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        console.log("Prio  Subject                                    Start       End")
        for (const d of formatted) {
          const prio = String(d.priority).padEnd(5)
          const subject = d.subject.substring(0, 42).padEnd(43)
          const start = `${d.startDate} ${d.startTime}`.padEnd(12)
          const end = `${d.endDate} ${d.endTime}`
          console.log(`${prio} ${subject} ${start} ${end}`)
        }
      } else {
        for (const d of formatted) {
          console.log(`[Prio ${d.priority}] ${d.subject}`)
          console.log(`  ${d.startDate} ${d.startTime} → ${d.endDate} ${d.endTime}`)
          console.log(`  ${d.message}`)
          if (d.affectedStops.length > 0) {
            console.log(`  Stops: ${d.affectedStops.join(", ")}`)
          }
          if (d.affectedLines.length > 0) {
            console.log(`  Lines: ${d.affectedLines.join(", ")}`)
          }
        }
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})
