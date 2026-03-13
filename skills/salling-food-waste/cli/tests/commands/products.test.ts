import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasApiKey } from "../helpers"

interface ProductResult {
  name: string
  category: string
  newPrice: number
  originalPrice: number
  discount: number
  percentDiscount: number
  stock: number
  stockUnit: string
  image: string | null
}

interface ProductsResponse {
  success: boolean
  type: string
  storeId: string
  storeName: string
  storeBrand: string
  productCount: number
  products: ProductResult[]
}

const SKIP = !hasApiKey()

// We need a valid store ID for products tests. This is a known Netto store in Copenhagen.
// We'll get one dynamically from search if the API key is available.
async function getAStoreId(): Promise<string | null> {
  if (!hasApiKey()) return null
  const proc = Bun.spawn(
    ["bun", "run", import.meta.dir + "/../../src/cli.ts", "search", "--zip", "2200"],
    { stdout: "pipe", stderr: "pipe", env: { ...process.env } }
  )
  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ])
  if (exitCode !== 0) return null
  try {
    const data = JSON.parse(stdout.trim())
    if (data.stores && data.stores.length > 0) {
      return data.stores[0].id as string
    }
  } catch {
    return null
  }
  return null
}

describe("products command", () => {
  test("missing storeId exits with error", async () => {
    const result = await runCLI(["products"])
    expect(result.exitCode).toBe(1)
  })

  test("invalid store ID returns API error", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const result = await runCLI(["products", "not-a-real-store-id-xyz"])
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain("error")
  })

  test("products for a real store returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const storeId = await getAStoreId()
    if (!storeId) {
      console.log("Skipping: no stores found in ZIP 2200")
      return
    }
    const result = await runCLI(["products", storeId])
    const data = parseJSON<ProductsResponse>(result)

    expect(data.success).toBe(true)
    expect(data.type).toBe("salling_food_waste_products")
    expect(data.storeId).toBe(storeId)
    expect(typeof data.storeName).toBe("string")
    expect(typeof data.storeBrand).toBe("string")
    expect(typeof data.productCount).toBe("number")
    expect(Array.isArray(data.products)).toBe(true)
    expect(data.productCount).toBe(data.products.length)
  })

  test("products have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const storeId = await getAStoreId()
    if (!storeId) {
      console.log("Skipping: no stores found in ZIP 2200")
      return
    }
    const result = await runCLI(["products", storeId])
    const data = parseJSON<ProductsResponse>(result)

    if (data.products.length > 0) {
      const p = data.products[0]
      expect(typeof p.name).toBe("string")
      expect(typeof p.category).toBe("string")
      expect(typeof p.newPrice).toBe("number")
      expect(typeof p.originalPrice).toBe("number")
      expect(typeof p.discount).toBe("number")
      expect(typeof p.percentDiscount).toBe("number")
      expect(typeof p.stock).toBe("number")
      expect(typeof p.stockUnit).toBe("string")
      // newPrice should be less than originalPrice
      expect(p.newPrice).toBeLessThanOrEqual(p.originalPrice)
    }
  })

  test("--limit caps the number of products", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const storeId = await getAStoreId()
    if (!storeId) {
      console.log("Skipping: no stores found in ZIP 2200")
      return
    }
    const result = await runCLI(["products", storeId, "--limit", "2"])
    const data = parseJSON<ProductsResponse>(result)

    expect(data.products.length).toBeLessThanOrEqual(2)
    expect(data.productCount).toBeLessThanOrEqual(2)
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const storeId = await getAStoreId()
    if (!storeId) {
      console.log("Skipping: no stores found in ZIP 2200")
      return
    }
    const result = await runCLI(["products", storeId, "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: SALLING_API_KEY not set")
      return
    }
    const storeId = await getAStoreId()
    if (!storeId) {
      console.log("Skipping: no stores found in ZIP 2200")
      return
    }
    const result = await runCLI(["products", storeId, "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
