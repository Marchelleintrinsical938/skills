import { createCLI } from "@bunli/core"
import { search } from "./commands/search.js"
import { products } from "./commands/products.js"

const cli = await createCLI({
  name: "salling-food-waste",
  version: "1.0.0",
  description: "CLI for finding discounted food waste items at Salling Group stores (Netto, føtex, Bilka, etc.)",
})

cli.command(search)
cli.command(products)

await cli.run()
