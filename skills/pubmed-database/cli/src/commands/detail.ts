import { defineCommand, option } from "@bunli/core"
import { z } from "zod"
import { apiFetch, writeError } from "../helpers.js"

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
  volume: string
  issue: string
  pages: string
  elocationid: string
  articleids: ESummaryArticleId[]
  fulljournalname: string
  sortpubdate: string
  pmcrefcount: number
  pubtype: string[]
  lang: string[]
  issn: string
  essn: string
  attributes: string[]
  pmid: string
}

interface ESummaryResult {
  result: Record<string, ESummaryDoc> & { uids: string[] }
}

function extractDoi(articleids: ESummaryArticleId[]): string | null {
  const doi = articleids.find((a) => a.idtype === "doi")
  return doi ? doi.value : null
}

function extractPmc(articleids: ESummaryArticleId[]): string | null {
  const pmc = articleids.find((a) => a.idtype === "pmc")
  return pmc ? pmc.value : null
}

export const detail = defineCommand({
  name: "detail",
  description: "Full ESummary record for a single PMID",
  options: {
    format: option(z.enum(["json", "plain"]).default("json"), {
      description: "Output format: json (default) or plain",
    }),
  },
  handler: async ({ positional, flags, signal }) => {
    if (signal.aborted) return

    const pmid = positional[0]

    if (!pmid) {
      writeError("PMID argument is required", "MISSING_REQUIRED")
      process.exit(1)
    }

    try {
      const summaryData = await apiFetch<ESummaryResult>("/esummary.fcgi", {
        db: "pubmed",
        id: pmid,
        retmode: "json",
      })

      if (signal.aborted) return

      const doc = summaryData.result[pmid]
      if (!doc) {
        writeError(`No record found for PMID ${pmid}`, "NOT_FOUND")
        process.exit(1)
      }

      const record = {
        pmid: doc.uid,
        title: doc.title,
        authors: doc.authors.map((a) => a.name),
        source: doc.source,
        fulljournalname: doc.fulljournalname,
        pubDate: doc.pubdate,
        sortPubDate: doc.sortpubdate,
        volume: doc.volume,
        issue: doc.issue,
        pages: doc.pages,
        doi: extractDoi(doc.articleids ?? []),
        pmc: extractPmc(doc.articleids ?? []),
        issn: doc.issn,
        essn: doc.essn,
        pubtype: doc.pubtype,
        lang: doc.lang,
        pmcRefCount: doc.pmcrefcount,
        attributes: doc.attributes,
        elocationid: doc.elocationid,
      }

      if (flags.format === "json") {
        console.log(JSON.stringify(record, null, 2))
      } else {
        outputPlain(record)
      }
    } catch (err) {
      writeError(err instanceof Error ? err.message : String(err), "API_ERROR")
      process.exit(1)
    }
  },
})

function outputPlain(r: {
  pmid: string
  title: string
  authors: string[]
  source: string
  fulljournalname: string
  pubDate: string
  volume: string
  issue: string
  pages: string
  doi: string | null
  pmc: string | null
  pubtype: string[]
  lang: string[]
  pmcRefCount: number
}): void {
  console.log(`PMID: ${r.pmid}`)
  console.log(`Title: ${r.title}`)
  console.log(`Authors: ${r.authors.join(", ")}`)
  console.log(`Journal: ${r.fulljournalname} (${r.source})`)
  console.log(`Date: ${r.pubDate}`)
  if (r.volume) console.log(`Volume: ${r.volume}  Issue: ${r.issue}  Pages: ${r.pages}`)
  if (r.doi) console.log(`DOI: ${r.doi}`)
  if (r.pmc) console.log(`PMC: ${r.pmc}`)
  if (r.pubtype?.length) console.log(`Publication types: ${r.pubtype.join(", ")}`)
  if (r.lang?.length) console.log(`Language: ${r.lang.join(", ")}`)
  console.log(`PMC citation count: ${r.pmcRefCount}`)
}
