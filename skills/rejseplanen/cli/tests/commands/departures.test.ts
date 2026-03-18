import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface DepartureItem {
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
  notes: Array<{ type: string; text: string }>
}

interface DeparturesResponse {
  type: string
  stop: string
  date: string
  time: string
  departures: DepartureItem[]
  count: number
}

const SKIP = !hasAccessId()

// København H stop ID
const KOEBENHAVN_H = "8600626"

describe("departures command", () => {
  test("missing --stop exits with error", async () => {
    const result = await runCLI(["departures"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("error")
  })

  test("departures returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "3"])
    const data = parseJSON<DeparturesResponse>(result)

    expect(data.type).toBe("rejseplanen_departures")
    expect(data.stop).toBe(KOEBENHAVN_H)
    expect(Array.isArray(data.departures)).toBe(true)
    expect(data.count).toBe(data.departures.length)
    expect(data.count).toBeGreaterThan(0)
  })

  test("departure items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "2"])
    const data = parseJSON<DeparturesResponse>(result)

    const dep = data.departures[0]
    expect(typeof dep.name).toBe("string")
    expect(typeof dep.line).toBe("string")
    expect(typeof dep.direction).toBe("string")
    expect(typeof dep.date).toBe("string")
    expect(typeof dep.time).toBe("string")
    expect(typeof dep.cancelled).toBe("boolean")
    expect(typeof dep.stopId).toBe("string")
    expect(typeof dep.delayed).toBe("boolean")
    expect(typeof dep.delayMinutes).toBe("number")
    expect(Array.isArray(dep.notes)).toBe(true)
  })

  test("--max param is accepted", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "3"])
    const data = parseJSON<DeparturesResponse>(result)
    expect(data.count).toBeGreaterThan(0)
  })

  test("--duration filters time window", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--duration", "15", "--max", "5"])
    const data = parseJSON<DeparturesResponse>(result)
    expect(data.type).toBe("rejseplanen_departures")
  })

  test("notes have correct structure when present", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "5"])
    const data = parseJSON<DeparturesResponse>(result)

    const withNotes = data.departures.find((d) => d.notes.length > 0)
    if (withNotes) {
      const note = withNotes.notes[0]
      expect(typeof note.type).toBe("string")
      expect(typeof note.text).toBe("string")
      expect(["bike", "accessibility", "info"]).toContain(note.type)
    }
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["departures", "--stop", KOEBENHAVN_H, "--max", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
