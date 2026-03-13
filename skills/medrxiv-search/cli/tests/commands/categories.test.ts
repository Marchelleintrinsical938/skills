import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "../helpers"

interface CategoriesResponse {
  success: boolean
  type: string
  count: number
  categories: string[]
}

describe("categories command", () => {
  test("returns correct shape", async () => {
    const result = await runCLI(["categories"])
    const data = parseJSON<CategoriesResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("medrxiv_categories")
    expect(typeof data.count).toBe("number")
    expect(Array.isArray(data.categories)).toBe(true)
  })

  test("count matches categories array length", async () => {
    const result = await runCLI(["categories"])
    const data = parseJSON<CategoriesResponse>(result)

    expect(data.count).toBe(data.categories.length)
    expect(data.count).toBeGreaterThan(0)
  })

  test("categories are strings", async () => {
    const result = await runCLI(["categories"])
    const data = parseJSON<CategoriesResponse>(result)

    for (const cat of data.categories) {
      expect(typeof cat).toBe("string")
      expect(cat.length).toBeGreaterThan(0)
    }
  })

  test("includes expected well-known categories", async () => {
    const result = await runCLI(["categories"])
    const data = parseJSON<CategoriesResponse>(result)

    expect(data.categories).toContain("epidemiology")
    expect(data.categories).toContain("oncology")
    expect(data.categories).toContain("infectious diseases")
    expect(data.categories).toContain("neurology")
    expect(data.categories).toContain("cardiovascular medicine")
  })

  test("has 51 categories", async () => {
    const result = await runCLI(["categories"])
    const data = parseJSON<CategoriesResponse>(result)

    expect(data.count).toBe(51)
    expect(data.categories.length).toBe(51)
  })

  test("--format plain outputs category names", async () => {
    const result = await runCLI(["categories", "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("epidemiology")
    expect(result.stdout).toContain("oncology")
    expect(result.stdout).toContain("count: 51")
  })
})
