---
name: pubmed-database
version: 2.0.0
description: >
  Make sure to use this skill whenever the user asks about biomedical or life sciences
  literature, medical research, clinical trials, systematic reviews, meta-analyses,
  drug studies, or any topic that might be in PubMed or MEDLINE — even if they don't
  mention PubMed explicitly. Also invoke for questions about specific PMIDs, DOIs,
  journal articles, abstracts, or citation lookups. Trigger phrases include:
  pubmed, medline, ncbi, biomedical research, medical literature, clinical trial,
  systematic review, meta-analysis, randomized controlled trial, RCT, MeSH terms,
  PMID, biomedical journal, life sciences paper, find article by author, find study on,
  search medical literature, evidence-based medicine, drug efficacy study,
  cancer research papers, diabetes research, cardiovascular study, neurology research,
  infectious disease literature, genomics paper, CRISPR study, COVID-19 research,
  vaccine efficacy study, find papers on, what does the literature say about,
  research on treatment of, studies on, cite this paper, look up this PMID,
  what papers exist on, what is the evidence for, find me studies about,
  medical journal search, biomedical database, abstract for paper,
  find citation, citation lookup, journal article search.
context: fork
allowed-tools: Bash(bun run skills/pubmed-database/cli/src/cli.ts *)
---

# PubMed Skill

Search and retrieve biomedical literature from the NCBI PubMed database via the E-utilities REST API. Access 35+ million citations from MEDLINE, life sciences journals, and online books. No authentication required.

## When to use this skill

Invoke this skill when the user wants to:

- Search PubMed for papers on any biomedical or life sciences topic
- Find clinical trials, systematic reviews, meta-analyses, or RCTs on a specific condition or treatment
- Retrieve abstracts or full citation details for one or more PMIDs
- Look up a specific paper by author, journal, year, volume, and page number
- Find papers using MeSH terms, field tags, or advanced Boolean queries
- Get the full bibliographic record for a known article (journal, volume, pages, DOI, PMC ID)
- Explore what the medical literature says about a drug, disease, or intervention

## Commands

### Search PubMed for articles

```bash
bun run skills/pubmed-database/cli/src/cli.ts search --query "<query>" [flags]
```

Key flags:
- `--query <q>` — **required**; full PubMed query syntax supported (Boolean, MeSH, field tags, date ranges, wildcards)
- `--max <n>` — number of results (default 20)
- `--start <n>` — offset for pagination (default 0)
- `--sort <order>` — `relevance` (default), `pub_date`, `first_author`
- `--limit <n>` — client-side cap
- `--format json|table|plain`

Returns `{ meta: { total, returnedCount, retstart }, results: [{ pmid, title, authors, source, pubDate, doi }] }`.

### Fetch abstracts by PMID

```bash
bun run skills/pubmed-database/cli/src/cli.ts fetch --ids <pmids> [--format text|medline]
```

- `--ids` — comma-separated PMIDs (required)
- `--format text` (default) — abstract text; `medline` — MEDLINE tagged format

Returns plain text (not JSON).

### Full record for a single PMID

```bash
bun run skills/pubmed-database/cli/src/cli.ts detail <pmid> [--format json|plain]
```

Returns complete bibliographic record including volume, issue, pages, DOI, PMC ID, publication types, citation count.

### Find PMID from partial citation

```bash
bun run skills/pubmed-database/cli/src/cli.ts cite-match \
  [--journal <j>] [--year <y>] [--volume <v>] [--page <p>] [--author <a>]
```

Returns `{ results: [{ citation, pmid, found }], rawResponse }`.

---

## How to use effectively

**Natural workflow: `search` → `fetch` or `detail`.**
1. Use `search` to find relevant PMIDs for a topic.
2. Call `fetch --ids <pmid>` to read the full abstract.
3. Call `detail <pmid>` for complete bibliographic metadata (journal, volume, DOI, PMC ID, citation count).

**Use PubMed query syntax in `--query`** for precise results:
- MeSH terms: `diabetes mellitus, type 2[mh]`
- Publication type: `AND systematic review[pt]`
- Date range: `AND 2020:2024[dp]`
- Title/abstract: `AND insulin resistance[tiab]`
- Free full text: `AND free full text[sb]`

**Pagination**: Use `--start` to page through results. `--max` is the page size (how many PMIDs ESearch retrieves).

**Unknown PMID for a paper?** Use `cite-match` with whatever citation details you have — journal, year, volume, page.

---

## Usage examples

### What are the latest RCTs on GLP-1 drugs for obesity?

```bash
bun run skills/pubmed-database/cli/src/cli.ts search \
  --query "GLP-1[tiab] AND obesity[mh] AND randomized controlled trial[pt] AND 2022:2024[dp]" \
  --max 5 --sort pub_date --format table
```

### Get the abstract for PMID 38123456

```bash
bun run skills/pubmed-database/cli/src/cli.ts fetch --ids 38123456
```

### Full bibliographic record for a PMID

```bash
bun run skills/pubmed-database/cli/src/cli.ts detail 20536893 --format plain
```

### Find the PMID for a known journal article

```bash
bun run skills/pubmed-database/cli/src/cli.ts cite-match \
  --journal "N Engl J Med" --year 2021 --volume 385 --page 1487
```

### Systematic reviews on COVID-19 long-term effects

```bash
bun run skills/pubmed-database/cli/src/cli.ts search \
  --query "(long covid[tiab] OR post-acute covid[tiab]) AND systematic review[pt]" \
  --max 5 --format table
```

### Search by author

```bash
bun run skills/pubmed-database/cli/src/cli.ts search \
  --query "Fauci AS[au] AND 2020:2024[dp]" --max 5
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — data processing, reading fields programmatically |
| `table` | Quick human-readable overviews |
| `plain` | Single-record views (`detail`) |

---

## Reference files

Extended documentation is in `references/`:
- `references/api_reference.md` — full E-utilities API docs
- `references/search_syntax.md` — PubMed query syntax, field tags, Boolean operators
- `references/common_queries.md` — example queries for diseases, study types, populations

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.
