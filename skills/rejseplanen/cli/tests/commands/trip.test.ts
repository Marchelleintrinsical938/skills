import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface TripLeg {
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
  notes: Array<{ type: string; text: string }>
  stops?: Array<{ name: string; arrival: string | null; departure: string | null }>
}

interface TripFare {
  passenger: string
  product: string
  class: string
  price: number
  currency: string
}

interface TripItem {
  origin: string
  destination: string
  departure: string
  arrival: string
  duration: string
  changes: number
  legs: TripLeg[]
  fares?: TripFare[]
}

interface TripResponse {
  type: string
  origin: string
  destination: string
  date: string
  time: string
  trips: TripItem[]
  tripCount: number
  via?: string
  scrollEarlier?: string
  scrollLater?: string
}

const SKIP = !hasAccessId()

describe("trip command", () => {
  test("missing --origin exits with error", async () => {
    const result = await runCLI(["trip", "--destination", "Aarhus"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("error")
  })

  test("missing --destination exits with error", async () => {
    const result = await runCLI(["trip", "--origin", "København"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toLowerCase()).toContain("error")
  })

  test("trip by name returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "2"])
    const data = parseJSON<TripResponse>(result)

    expect(data.type).toBe("rejseplanen_trip")
    expect(data.origin).toBe("København H")
    expect(data.destination).toBe("Odense")
    expect(Array.isArray(data.trips)).toBe(true)
    expect(data.tripCount).toBe(data.trips.length)
    expect(data.tripCount).toBeGreaterThan(0)
  })

  test("trip items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1"])
    const data = parseJSON<TripResponse>(result)

    const trip = data.trips[0]
    expect(typeof trip.origin).toBe("string")
    expect(typeof trip.destination).toBe("string")
    expect(typeof trip.departure).toBe("string")
    expect(typeof trip.arrival).toBe("string")
    expect(typeof trip.duration).toBe("string")
    expect(typeof trip.changes).toBe("number")
    expect(Array.isArray(trip.legs)).toBe(true)
    expect(trip.legs.length).toBeGreaterThan(0)
  })

  test("trip legs have delay and notes fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1"])
    const data = parseJSON<TripResponse>(result)

    const leg = data.trips[0].legs[0]
    expect(typeof leg.delayed).toBe("boolean")
    expect(typeof leg.delayMinutes).toBe("number")
    expect(Array.isArray(leg.notes)).toBe(true)
  })

  test("fares included by default", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1"])
    const data = parseJSON<TripResponse>(result)

    const trip = data.trips[0]
    expect(trip.fares).toBeDefined()
    expect(Array.isArray(trip.fares)).toBe(true)
    if (trip.fares!.length > 0) {
      const fare = trip.fares![0]
      expect(typeof fare.passenger).toBe("string")
      expect(typeof fare.product).toBe("string")
      expect(typeof fare.class).toBe("string")
      expect(typeof fare.price).toBe("number")
      expect(fare.price).toBeGreaterThan(0)
      expect(fare.currency).toBe("DKK")
    }
  })

  test("--no-fares excludes pricing", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1", "--no-fares"])
    const data = parseJSON<TripResponse>(result)
    expect(data.trips[0].fares).toBeUndefined()
  })

  test("scroll tokens are included", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "2"])
    const data = parseJSON<TripResponse>(result)
    expect(typeof data.scrollEarlier).toBe("string")
    expect(typeof data.scrollLater).toBe("string")
  })

  test("--stops includes intermediate stops", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1", "--stops"])
    const data = parseJSON<TripResponse>(result)

    const transitLeg = data.trips[0].legs.find((l) => l.type !== "WALK")
    if (transitLeg) {
      expect(transitLeg.stops).toBeDefined()
      expect(Array.isArray(transitLeg.stops)).toBe(true)
      expect(transitLeg.stops!.length).toBeGreaterThan(0)
      expect(typeof transitLeg.stops![0].name).toBe("string")
    }
  })

  test("--results limits trip count", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Aarhus H", "--results", "1"])
    const data = parseJSON<TripResponse>(result)
    expect(data.tripCount).toBeLessThanOrEqual(2)
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["trip", "--origin", "København H", "--destination", "Odense", "--results", "1", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
