import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasApiKey } from "../helpers"

interface StoreResult {
  id: string
  name: string
  brand: string
  address: string
  itemCount: number
}

interface SearchResponse {
  success: boolean
  type: string
  query: Record<string, unknown>
  storeCount: number
  stores: StoreResult[]
}

const SKIP = !hasApiKey()

describe("search command", () => {
  test("missing --zip and --lat/--lon exits with error", async () => {
    const result = await runCLI(["search"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("error")
  })

  test("missing --lon when --lat provided exits with error", async () => {
    const result = await runCLI(["search", "--lat", "55.6761"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("error")
  })

  test("search by ZIP returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    // 2200 = Copenhagen NW, typically has stores
    const result = await runCLI(["search", "--zip", "2200"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("salling_food_waste_search")
    expect(typeof data.storeCount).toBe("number")
    expect(Array.isArray(data.stores)).toBe(true)
    expect(data.storeCount).toBe(data.stores.length)
  })

  test("search by ZIP: query field contains zip", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const result = await runCLI(["search", "--zip", "8000"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.query).toHaveProperty("zip", "8000")
  })

  test("search by geo returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    // Copenhagen center
    const result = await runCLI(["search", "--lat", "55.6761", "--lon", "12.5683", "--radius", "3"])
    const data = parseJSON<SearchResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("salling_food_waste_search")
    expect(Array.isArray(data.stores)).toBe(true)
    expect(data.query).toHaveProperty("lat")
    expect(data.query).toHaveProperty("lon")
    expect(data.query).toHaveProperty("radius")
  })

  test("store items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const result = await runCLI(["search", "--zip", "2200"])
    const data = parseJSON<SearchResponse>(result)

    if (data.stores.length > 0) {
      const store = data.stores[0]
      expect(typeof store.id).toBe("string")
      expect(typeof store.name).toBe("string")
      expect(typeof store.brand).toBe("string")
      expect(typeof store.address).toBe("string")
      expect(typeof store.itemCount).toBe("number")
    }
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const result = await runCLI(["search", "--zip", "2200", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const result = await runCLI(["search", "--zip", "2200", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })

  test("no SALLING_API_KEY gives clear error", async () => {
    const proc = Bun.spawn(["bun", "run", import.meta.dir + "/../../src/cli.ts", "search", "--zip", "2200"], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, SALLING_API_KEY: "" },
    })
    const [stderr, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    expect(exitCode).toBe(1)
    expect(stderr).toContain("SALLING_API_KEY")
  })
})
