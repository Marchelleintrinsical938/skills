import { createCLI } from "@bunli/core"
import { search } from "./commands/search.js"
import { rentals } from "./commands/rentals.js"
import { sold } from "./commands/sold.js"
import { detail } from "./commands/detail.js"
import { timeline } from "./commands/timeline.js"
import { locations } from "./commands/locations.js"
import { municipalities } from "./commands/municipalities.js"

const cli = await createCLI({
  name: "boligsiden",
  version: "1.0.0",
  description: "CLI for the Boligsiden.dk public property API",
})

cli.command(search)
cli.command(rentals)
cli.command(sold)
cli.command(detail)
cli.command(timeline)
cli.command(locations)
cli.command(municipalities)

await cli.run()
