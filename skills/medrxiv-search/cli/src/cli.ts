import { createCLI } from "@bunli/core"
import { search } from "./commands/search.js"
import { doi } from "./commands/doi.js"
import { categories } from "./commands/categories.js"

const cli = await createCLI({
  name: "medrxiv-cli",
  version: "1.0.0",
  description: "CLI for searching medRxiv medical preprints via the CSHL free API",
})

cli.command(search)
cli.command(doi)
cli.command(categories)

await cli.run()
