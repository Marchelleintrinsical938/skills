import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { BASE_URL } from "../helpers.js"

interface Municipality {
  municipalityCode: number
  name: string
  population?: number
  churchTaxPercentage?: number
  councilTaxPercentage?: number
  landValueTaxLevelPerThousand?: number
  slug?: string
  regionCode?: number
  [key: string]: unknown
}

interface MappedMunicipality {
  code: number
  name: string
  population: number | null | undefined
  churchTaxPercentage?: number
  councilTaxPercentage?: number
  landValueTaxLevelPerThousand?: number
  slug?: string
  regionCode?: number
  [key: string]: unknown
}

export const municipalities = defineCommand({
  name: "municipalities",
  description: "List all Danish municipalities",
  options: {
    limit: option(z.coerce.number().optional(), {
      description: "Cap number of results",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    try {
      const response = await fetch(`${BASE_URL}/municipalities`)
      if (!response.ok) {
        process.stderr.write(JSON.stringify({ error: `API error: ${response.statusText}`, code: "FETCH_ERROR" }) + "\n")
        process.exit(1)
      }
      const data = await response.json() as { municipalities: Municipality[] }

      if (signal.aborted) return

      // Remap municipalityCode -> code for consistent interface
      // Ensure population is always present (even if null for small municipalities like Christiansø)
      let mapped: MappedMunicipality[] = data.municipalities.map((m) => {
        const { municipalityCode, ...rest } = m
        const obj: MappedMunicipality = { code: municipalityCode, population: null, ...rest }
        return obj
      })

      if (flags.limit !== undefined) {
        mapped = mapped.slice(0, flags.limit)
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(mapped, null, 2))
      } else if (flags.format === "table") {
        outputTable(mapped)
      } else {
        outputPlain(mapped)
      }
    } catch (err) {
      process.stderr.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err), code: "FETCH_ERROR" }) + "\n")
      process.exit(1)
    }
  },
})

function outputTable(municipalities: MappedMunicipality[]): void {
  console.log("code  name                       population  propTaxRate  landTaxRate")
  for (const m of municipalities) {
    const code = String(m.code).padEnd(5)
    const name = String(m.name).padEnd(26)
    const pop = String(m.population ?? "-").padEnd(11)
    const propTax = m.councilTaxPercentage !== undefined ? `${m.councilTaxPercentage}%` : "-"
    const landTax = m.landValueTaxLevelPerThousand !== undefined ? `${m.landValueTaxLevelPerThousand}‰` : "-"
    console.log(`${code} ${name} ${pop} ${propTax.padEnd(12)} ${landTax}`)
  }
}

function outputPlain(municipalities: MappedMunicipality[]): void {
  for (const m of municipalities) {
    console.log(`code: ${m.code}`)
    console.log(`name: ${m.name}`)
    console.log(`population: ${m.population ?? "-"}`)
    if (m.councilTaxPercentage !== undefined) console.log(`councilTaxPercentage: ${m.councilTaxPercentage}`)
    if (m.landValueTaxLevelPerThousand !== undefined) console.log(`landValueTaxLevelPerThousand: ${m.landValueTaxLevelPerThousand}`)
    console.log("")
  }
}
