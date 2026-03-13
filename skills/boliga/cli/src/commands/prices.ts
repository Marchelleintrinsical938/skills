import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

export const prices = defineCommand({
  name: "prices",
  description: "Quarterly price index (historical)",
  options: {
    "property-type": option(z.coerce.number().optional(), {
      description: "Filter by property type (1=Villa, 3=Apartment, etc.)",
    }),
    "area-type": option(z.string().optional(), {
      description: "Area type: zip",
    }),
    "area-id": option(z.string().optional(), {
      description: "Area ID, e.g. zip code 2100",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap number of data points returned",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const params: Record<string, string> = {}
    if (flags["property-type"] !== undefined) params["propertyType"] = String(flags["property-type"])
    if (flags["area-type"]) params["areaType"] = flags["area-type"]
    if (flags["area-id"]) params["areaId"] = flags["area-id"]

    try {
      const data = await apiFetch<{ data: unknown[]; areaList: unknown[]; salesPricesChartData: unknown[] }>("/statistics/historicalprices", params)

      if (signal.aborted) return

      let priceData = data.data as Record<string, unknown>[]
      if (flags.limit !== undefined) {
        priceData = priceData.slice(0, flags.limit)
      }

      const output = {
        data: priceData,
        areaList: data.areaList,
        salesPricesChartData: data.salesPricesChartData,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(output, null, 2))
      } else if (flags.format === "table") {
        outputTable(priceData)
      } else {
        outputPlain(priceData)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function outputTable(data: Record<string, unknown>[]): void {
  console.log("date                  value    qtrChange  yrChange  since1995")
  for (const entry of data) {
    const rkr = entry.rkrQuarterData as Record<string, unknown> | undefined
    if (!rkr) continue
    const date = String(rkr.date ?? "-").substring(0, 10).padEnd(10)
    const value = String(rkr.value ?? "-").padEnd(8)
    const qtr = String(rkr.changeSinceLastQuarter ?? "-").padEnd(10)
    const yr = String(rkr.changeSinceLastYear ?? "-").padEnd(9)
    const s95 = String(rkr.changeSince1995 ?? "-")
    console.log(`${date}  ${value} ${qtr} ${yr} ${s95}`)
  }
}

function outputPlain(data: Record<string, unknown>[]): void {
  for (const entry of data) {
    const rkr = entry.rkrQuarterData as Record<string, unknown> | undefined
    if (!rkr) continue
    console.log(`date: ${rkr.date}`)
    console.log(`value: ${rkr.value} kr/m²`)
    console.log(`change since last quarter: ${rkr.changeSinceLastQuarter}%`)
    console.log(`change since last year: ${rkr.changeSinceLastYear}%`)
    console.log(`change since 1995: ${rkr.changeSince1995}%`)
    console.log("")
  }
}
