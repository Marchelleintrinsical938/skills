import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface ArrivalItem {
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
  notes: Array<{ type: string; text: string }>
}

interface ArrivalsResponse {
  type: string
  stop: string
  date: string
  time: string
  arrivals: ArrivalItem[]
  count: number
}

const SKIP = !hasAccessId()

// København H stop ID
const KOEBENHAVN_H = "8600626"

describe("arrivals command", () => {
  test("missing --stop exits with error", async () => {
    const result = await runCLI(["arrivals"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("error")
  })

  test("arrivals returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["arrivals", "--stop", KOEBENHAVN_H, "--max", "3"])
    const data = parseJSON<ArrivalsResponse>(result)

    expect(data.type).toBe("rejseplanen_arrivals")
    expect(data.stop).toBe(KOEBENHAVN_H)
    expect(Array.isArray(data.arrivals)).toBe(true)
    expect(data.count).toBe(data.arrivals.length)
    expect(data.count).toBeGreaterThan(0)
  })

  test("arrival items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["arrivals", "--stop", KOEBENHAVN_H, "--max", "2"])
    const data = parseJSON<ArrivalsResponse>(result)

    const arr = data.arrivals[0]
    expect(typeof arr.name).toBe("string")
    expect(typeof arr.line).toBe("string")
    expect(typeof arr.origin).toBe("string")
    expect(typeof arr.date).toBe("string")
    expect(typeof arr.time).toBe("string")
    expect(typeof arr.cancelled).toBe("boolean")
    expect(typeof arr.stopId).toBe("string")
    expect(typeof arr.delayed).toBe("boolean")
    expect(typeof arr.delayMinutes).toBe("number")
    expect(Array.isArray(arr.notes)).toBe(true)
  })

  test("--max param is accepted", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["arrivals", "--stop", KOEBENHAVN_H, "--max", "3"])
    const data = parseJSON<ArrivalsResponse>(result)
    expect(data.count).toBeGreaterThan(0)
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["arrivals", "--stop", KOEBENHAVN_H, "--max", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["arrivals", "--stop", KOEBENHAVN_H, "--max", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
