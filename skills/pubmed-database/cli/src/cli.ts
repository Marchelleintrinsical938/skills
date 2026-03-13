import { createCLI } from "@bunli/core"
import { search } from "./commands/search.js"
import { fetch_ } from "./commands/fetch.js"
import { detail } from "./commands/detail.js"
import { citeMatch } from "./commands/cite-match.js"

const cli = await createCLI({
  name: "pubmed-cli",
  version: "1.0.0",
  description: "CLI for the NCBI PubMed E-utilities REST API",
})

cli.command(search)
cli.command(fetch_)
cli.command(detail)
cli.command(citeMatch)

await cli.run()
