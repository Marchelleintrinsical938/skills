import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { CATEGORIES } from "../helpers.js"

export const categories = defineCommand({
  name: "categories",
  description: "List all available medRxiv categories",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json, plain",
    }),
  },
  handler: async ({ flags }) => {
    const output = {
      success: true,
      type: "medrxiv_categories",
      count: CATEGORIES.length,
      categories: [...CATEGORIES],
    }

    if (flags.format === "json") {
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log(`count: ${output.count}`)
      console.log("")
      for (const cat of output.categories) {
        console.log(cat)
      }
    }
  },
})
