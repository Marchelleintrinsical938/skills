import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface NearbyStop {
  id: string
  name: string
  lat: number
  lon: number
  dist: number
  type: string
}

interface NearbyResponse {
  type: string
  lat: number
  lon: number
  radius: number
  stops: NearbyStop[]
  count: number
}

const SKIP = !hasAccessId()

// Coordinates near København H
const LAT = "55.672736"
const LON = "12.565558"

describe("nearby command", () => {
  test("missing --lat exits with error", async () => {
    const result = await runCLI(["nearby", "--lon", LON])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("lat")
  })

  test("missing --lon exits with error", async () => {
    const result = await runCLI(["nearby", "--lat", LAT])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("lon")
  })

  test("nearby returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["nearby", "--lat", LAT, "--lon", LON, "--max", "3"])
    const data = parseJSON<NearbyResponse>(result)

    expect(data.type).toBe("rejseplanen_nearby")
    expect(typeof data.lat).toBe("number")
    expect(typeof data.lon).toBe("number")
    expect(data.radius).toBe(1000)
    expect(Array.isArray(data.stops)).toBe(true)
    expect(data.count).toBe(data.stops.length)
    expect(data.count).toBeGreaterThan(0)
  })

  test("nearby stops have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["nearby", "--lat", LAT, "--lon", LON, "--max", "2"])
    const data = parseJSON<NearbyResponse>(result)

    const stop = data.stops[0]
    expect(typeof stop.id).toBe("string")
    expect(typeof stop.name).toBe("string")
    expect(typeof stop.lat).toBe("number")
    expect(typeof stop.lon).toBe("number")
    expect(typeof stop.dist).toBe("number")
    expect(typeof stop.type).toBe("string")
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["nearby", "--lat", LAT, "--lon", LON, "--max", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["nearby", "--lat", LAT, "--lon", LON, "--max", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
