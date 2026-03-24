import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface LocationItem {
  id: string
  name: string
  lat: number
  lon: number
  type: string
}

interface LocationResponse {
  type: string
  query: string
  locations: LocationItem[]
  count: number
}

const SKIP = !hasAccessId()

describe("location command", () => {
  test("missing --query exits with error", async () => {
    const result = await runCLI(["location"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("error")
  })

  test("search by name returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["location", "--query", "København H", "--max", "3"])
    const data = parseJSON<LocationResponse>(result)

    expect(data.type).toBe("rejseplanen_location")
    expect(data.query).toBe("København H")
    expect(Array.isArray(data.locations)).toBe(true)
    expect(data.count).toBe(data.locations.length)
    expect(data.count).toBeGreaterThan(0)
  })

  test("location items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["location", "--query", "Nørreport", "--max", "2"])
    const data = parseJSON<LocationResponse>(result)

    expect(data.locations.length).toBeGreaterThan(0)
    const loc = data.locations[0]
    expect(typeof loc.id).toBe("string")
    expect(typeof loc.name).toBe("string")
    expect(typeof loc.lat).toBe("number")
    expect(typeof loc.lon).toBe("number")
    expect(typeof loc.type).toBe("string")
  })

  test("--max limits results", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["location", "--query", "Station", "--max", "2"])
    const data = parseJSON<LocationResponse>(result)
    expect(data.count).toBeLessThanOrEqual(2)
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["location", "--query", "Aarhus", "--max", "2", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["location", "--query", "Aarhus", "--max", "2", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })

  test("no REJSEPLANEN_ACCESS_ID gives clear error", async () => {
    const proc = Bun.spawn(["bun", "run", import.meta.dir + "/../../src/cli.ts", "location", "--query", "test"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, REJSEPLANEN_ACCESS_ID: "" },
    })
    const [stderr, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    expect(exitCode).toBe(1)
    expect(stderr).toContain("REJSEPLANEN_ACCESS_ID")
  })
})
