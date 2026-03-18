import { createCLI } from "@bunli/core"
import { location } from "./commands/location.js"
import { trip } from "./commands/trip.js"
import { departures } from "./commands/departures.js"
import { arrivals } from "./commands/arrivals.js"
import { nearby } from "./commands/nearby.js"
import { disruptions } from "./commands/disruptions.js"

const cli = await createCLI({
  name: "rejseplanen",
  version: "1.0.0",
  description: "CLI for Danish public transport journey planning via the Rejseplanen API",
})

cli.command(location)
cli.command(trip)
cli.command(departures)
cli.command(arrivals)
cli.command(nearby)
cli.command(disruptions)

await cli.run()
