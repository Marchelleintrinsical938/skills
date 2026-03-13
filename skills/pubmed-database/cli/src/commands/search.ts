import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError, rateDelay } from "../helpers.js"

// Sort values accepted by ESearch
const sortMap: Record<string, string> = {
  relevance: "relevance",
  pub_date: "pub_date",
  first_author: "first_author",
}

interface ESearchResult {
  esearchresult: {
    count: string
    retmax: string
    retstart: string
    idlist: string[]
  }
}

interface ESummaryAuthor {
  name: string
  authtype: string
}

interface ESummaryArticleId {
  idtype: string
  value: string
}

interface ESummaryDoc {
  uid: string
  title: string
  authors: ESummaryAuthor[]
  source: string
  pubdate: string
  elocationid: string
  articleids: ESummaryArticleId[]
}

interface ESummaryResult {
  result: Record<string, ESummaryDoc> & { uids: string[] }
}

function extractDoi(articleids: ESummaryArticleId[]): string | null {
  const doi = articleids.find((a) => a.idtype === "doi")
  return doi ? doi.value : null
}

function normalizeArticle(doc: ESummaryDoc): {
  pmid: string
  title: string
  authors: string[]
  source: string
  pubDate: string
  doi: string | null
} {
  return {
    pmid: doc.uid,
    title: doc.title,
    authors: doc.authors.map((a) => a.name),
    source: doc.source,
    pubDate: doc.pubdate,
    doi: extractDoi(doc.articleids ?? []),
  }
}

export const search = defineCommand({
  name: "search",
  description: "Search PubMed and return article summaries",
  options: {
    query: option(z.string(), {
      description: "PubMed search query (required)",
    }),
    max: option(z.coerce.number().default(20), {
      description: "Maximum number of PMIDs to retrieve from ESearch (default 20)",
    }),
    start: option(z.coerce.number().default(0), {
      description: "Offset for ESearch results (default 0)",
    }),
    sort: option(z.string().default("relevance"), {
      description: "Sort order: relevance (default), pub_date, first_author",
    }),
    limit: option(z.coerce.number().optional(), {
      description: "Cap total results returned by CLI",
    }),
    format: option(z.enum(["json", "table", "plain"]).default("json"), {
      description: "Output format: json, table, plain",
    }),
  },
  handler: async ({ flags, signal }) => {
    if (signal.aborted) return

    const sortValue = sortMap[flags.sort] ?? "relevance"

    try {
      // Step 1: ESearch to get PMIDs
      const searchData = await apiFetch<ESearchResult>("/esearch.fcgi", {
        db: "pubmed",
        term: flags.query,
        retmax: String(flags.max),
        retstart: String(flags.start),
        retmode: "json",
        sort: sortValue,
      })

      if (signal.aborted) return

      const { count, retstart, idlist } = searchData.esearchresult
      const total = parseInt(count, 10)

      if (idlist.length === 0) {
        const output = {
          meta: { total, returnedCount: 0, retstart: parseInt(retstart, 10) },
          results: [],
        }
        console.log(JSON.stringify(output, null, 2))
        return
      }

      await rateDelay()
      if (signal.aborted) return

      // Step 2: ESummary to get article details
      const summaryData = await apiFetch<ESummaryResult>("/esummary.fcgi", {
        db: "pubmed",
        id: idlist.join(","),
        retmode: "json",
      })

      if (signal.aborted) return

      let results = idlist
        .filter((id) => id in summaryData.result)
        .map((id) => normalizeArticle(summaryData.result[id]))

      if (flags.limit !== undefined) {
        results = results.slice(0, flags.limit)
      }

      const output = {
        meta: {
          total,
          returnedCount: results.length,
          retstart: parseInt(retstart, 10),
        },
        results,
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

function outputTable(
  results: Array<{ pmid: string; title: string; authors: string[]; source: string; pubDate: string; doi: string | null }>
): void {
  console.log("pmid       pubDate    source                     title")
  for (const r of results) {
    const pmid = r.pmid.padEnd(10)
    const date = r.pubDate.substring(0, 10).padEnd(10)
    const source = r.source.substring(0, 26).padEnd(26)
    const title = r.title.substring(0, 60)
    console.log(`${pmid} ${date} ${source} ${title}`)
  }
}

function outputPlain(
  results: Array<{ pmid: string; title: string; authors: string[]; source: string; pubDate: string; doi: string | null }>
): void {
  for (const r of results) {
    console.log(`PMID: ${r.pmid}`)
    console.log(`Title: ${r.title}`)
    console.log(`Authors: ${r.authors.join(", ")}`)
    console.log(`Source: ${r.source}`)
    console.log(`Date: ${r.pubDate}`)
    if (r.doi) console.log(`DOI: ${r.doi}`)
    console.log("")
  }
}
