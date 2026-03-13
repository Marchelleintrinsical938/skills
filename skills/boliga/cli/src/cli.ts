import { createCLI } from "@bunli/core"
import { search } from "./commands/search.js"
import { sold } from "./commands/sold.js"
import { detail } from "./commands/detail.js"
import { property } from "./commands/property.js"
import { suggestions } from "./commands/suggestions.js"
import { stats } from "./commands/stats.js"
import { prices } from "./commands/prices.js"
import { mostviewed } from "./commands/mostviewed.js"

const cli = await createCLI({
  name: "boliga-cli",
  version: "0.1.0",
  description: "CLI for the Boliga.dk public property API",
})

cli.command(search)
cli.command(sold)
cli.command(detail)
cli.command(property)
cli.command(suggestions)
cli.command(stats)
cli.command(prices)
cli.command(mostviewed)

await cli.run()
