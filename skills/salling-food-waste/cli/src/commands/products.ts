import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import {
  apiFetch,
  formatProduct,
  writeError,
  type FormattedProduct,
  type StoreWithClearances,
} from "../helpers.js"

export const products = defineCommand({
  name: "products",
  description: "Get discounted food waste products at a specific store",
  options: {
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap the number of products returned",
    }),
  },
  handler: async ({ flags, positional, signal }) => {
    if (signal.aborted) return

    const storeId = positional[0] as string | undefined

    if (!storeId) {
      writeError("storeId argument is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      const data = await apiFetch<StoreWithClearances>(`/v1/food-waste/${storeId}`)

      if (signal.aborted) return

      let clearances = data.clearances ?? []
      let results = clearances.map(formatProduct)

      // Client-side limit
      if (flags.limit !== undefined) {
        results = results.slice(0, flags.limit)
      }

      const output = {
        success: true,
        type: "salling_food_waste_products",
        storeId,
        storeName: data.store?.name ?? "",
        storeBrand: data.store?.brand ?? "",
        productCount: results.length,
        products: results,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        outputTable(results)
      } else {
        outputPlain(results)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function outputTable(results: FormattedProduct[]): void {
  console.log("name                               category            new    orig   disc%  stock")
  for (const r of results) {
    const name = r.name.substring(0, 34).padEnd(35)
    const category = r.category.substring(0, 19).padEnd(20)
    const newPrice = String(r.newPrice.toFixed(2)).padEnd(6)
    const origPrice = String(r.originalPrice.toFixed(2)).padEnd(6)
    const pct = String(r.percentDiscount.toFixed(0)).padEnd(6)
    const stock = `${r.stock} ${r.stockUnit}`
    console.log(`${name} ${category} ${newPrice} ${origPrice} ${pct} ${stock}`)
  }
}

function outputPlain(results: FormattedProduct[]): void {
  for (const r of results) {
    console.log(`name: ${r.name}`)
    console.log(`category: ${r.category}`)
    console.log(`price: ${r.newPrice} DKK (was ${r.originalPrice} DKK, ${r.percentDiscount}% off)`)
    console.log(`stock: ${r.stock} ${r.stockUnit}`)
    console.log("")
  }
}
