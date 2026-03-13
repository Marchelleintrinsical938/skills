# pubmed-cli

CLI for the [NCBI PubMed E-utilities REST API](https://www.ncbi.nlm.nih.gov/books/NBK25501/).

**Base URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
**Authentication**: None required (3 req/sec without API key).
**Format**: JSON for most responses; plain text for `fetch`.

---

## Installation

```bash
cd skills/pubmed-database/cli
bun install
```

---

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search PubMed and get article summaries (ESearch → ESummary pipeline) |
| `fetch` | Download abstracts or MEDLINE records for given PMIDs |
| `detail` | Full ESummary record for a single PMID |
| `cite-match` | Find PMID from partial citation (journal, year, volume, page, author) |

All commands accept `--format` where applicable. All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and exit with code `1`.

---

## `search` — Search PubMed

Uses the ESearch → ESummary pipeline: ESearch retrieves PMIDs matching the query, then ESummary fetches article details for those PMIDs.

```bash
bun run src/cli.ts search --query <query> [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--query` | string | **required** | PubMed search query (supports full PubMed syntax, MeSH, Boolean operators) |
| `--max` | number | `20` | Maximum number of PMIDs to retrieve from ESearch |
| `--start` | number | `0` | Offset into ESearch results (for pagination) |
| `--sort` | string | `relevance` | Sort order: `relevance`, `pub_date`, `first_author` |
| `--limit` | number | — | Cap total results returned by CLI (client-side) |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Example

```bash
# Recent RCTs on diabetes management
bun run src/cli.ts search \
  --query "diabetes mellitus, type 2[mh] AND randomized controlled trial[pt] AND 2023:2024[dp]" \
  --max 5 \
  --sort pub_date

# Simple keyword search
bun run src/cli.ts search --query "COVID-19 vaccine efficacy" --max 3 --format table
```

### Response shape

```json
{
  "meta": {
    "total": 425873,
    "returnedCount": 3,
    "retstart": 0
  },
  "results": [
    {
      "pmid": "38123456",
      "title": "Effect of GLP-1 receptor agonists on glycemic control in type 2 diabetes: a meta-analysis",
      "authors": ["Smith JA", "Jones MB", "Wilson KC"],
      "source": "Diabetes Care",
      "pubDate": "2024 Jan",
      "doi": "10.2337/dc23-1234"
    }
  ]
}
```

**Field descriptions**:
- `meta.total` — total number of records matching the query in PubMed
- `meta.returnedCount` — number of records in this response
- `meta.retstart` — offset used (for pagination)
- `pmid` — PubMed ID (string)
- `title` — article title
- `authors` — array of author names in "Last FM" format
- `source` — journal abbreviation
- `pubDate` — publication date string (e.g. "2024 Jan", "2023 Mar 15")
- `doi` — DOI string or `null` if not available

---

## `fetch` — Fetch abstracts by PMID

Downloads full abstract text or MEDLINE-formatted records for one or more PMIDs.

```bash
bun run src/cli.ts fetch --ids <pmids> [--format text|medline]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--ids` | string | **required** | Comma-separated PMIDs, e.g. `38123456,38123457` |
| `--format` | string | `text` | `text` = abstract text; `medline` = MEDLINE tagged format |

### Example

```bash
# Single PMID abstract
bun run src/cli.ts fetch --ids 20536893

# Multiple PMIDs, MEDLINE format
bun run src/cli.ts fetch --ids 20536893,17671087 --format medline
```

### Response

Returns plain text (not JSON). The text format contains formatted abstract(s) from NCBI. The MEDLINE format contains tagged fields (`PMID`, `TI`, `AU`, `AB`, `DP`, `JT`, etc.).

---

## `detail` — Full record for a single PMID

Retrieves the complete ESummary document for a single article.

```bash
bun run src/cli.ts detail <pmid> [--format json|plain]
```

The `pmid` is a positional argument (the numeric PubMed ID).

### Example

```bash
bun run src/cli.ts detail 20536893
bun run src/cli.ts detail 20536893 --format plain
```

### Response shape

```json
{
  "pmid": "20536893",
  "title": "A randomized trial of epidural glucocorticoid injections for spinal stenosis",
  "authors": ["Friedly JL", "Comstock BA", "Turner JA"],
  "source": "N Engl J Med",
  "fulljournalname": "The New England Journal of Medicine",
  "pubDate": "2014 Jul 3",
  "sortPubDate": "2014/07/03 00:00",
  "volume": "371",
  "issue": "1",
  "pages": "11-21",
  "doi": "10.1056/NEJMoa1313265",
  "pmc": null,
  "issn": "0028-4793",
  "essn": "1533-4406",
  "pubtype": ["Journal Article", "Randomized Controlled Trial"],
  "lang": ["eng"],
  "pmcRefCount": 0,
  "attributes": [],
  "elocationid": "10.1056/NEJMoa1313265 [doi]"
}
```

**Field descriptions**:
- `pmid` — PubMed ID (string)
- `fulljournalname` — full journal name
- `volume`, `issue`, `pages` — bibliographic details
- `doi` — DOI or `null`
- `pmc` — PMC ID or `null` if not in PubMed Central
- `pubtype` — array of publication type strings
- `lang` — array of language codes
- `pmcRefCount` — citation count in PMC
- `elocationid` — electronic location identifier

---

## `cite-match` — Find PMID from partial citation

Uses the ECitMatch API to look up a PMID from journal, year, volume, page, and/or author.

```bash
bun run src/cli.ts cite-match [--journal <j>] [--year <y>] [--volume <v>] [--page <p>] [--author <a>]
```

At least one flag must be provided.

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--journal` | string | — | Journal name or abbreviation (e.g. `Science`, `N Engl J Med`) |
| `--year` | string | — | Publication year (e.g. `2008`) |
| `--volume` | string | — | Volume number |
| `--page` | string | — | First page number |
| `--author` | string | — | Author last name |
| `--format` | string | `json` | Output format: `json` or `plain` |

### Example

```bash
# Find a well-known Science paper
bun run src/cli.ts cite-match \
  --journal Science \
  --year 2008 \
  --volume 320 \
  --page 1185

# Find by author and journal
bun run src/cli.ts cite-match --journal Nature --year 2010 --author Venter
```

### Response shape

```json
{
  "results": [
    {
      "citation": "Science|2008|320|1185|",
      "pmid": "18497267",
      "found": true
    }
  ],
  "rawResponse": "Science|2008|320|1185||key1|18497267"
}
```

**Field descriptions**:
- `results[].citation` — the citation fields joined with `|`
- `results[].pmid` — found PMID string, or `null` if not found
- `results[].found` — boolean indicating whether a match was found
- `rawResponse` — the raw ECitMatch response line(s)

When a citation is not found, ECitMatch returns `NOT_FOUND` in the result field and `found` will be `false`, `pmid` will be `null`.

---

## Error handling

All errors are written to **stderr** in JSON format and exit with code `1`:

```json
{ "error": "API request failed: 429 Too Many Requests", "code": "API_ERROR" }
{ "error": "--ids is required", "code": "MISSING_REQUIRED" }
{ "error": "No record found for PMID 99999999", "code": "NOT_FOUND" }
```

---

## API notes

- **Rate limit**: 3 requests/second without API key. The CLI adds a ~350ms delay between chained requests (ESearch + ESummary in `search`).
- **Retry logic**: `apiFetch` retries on 429 and 5xx responses with exponential backoff (6 retries, 500ms base, 5s max, random jitter).
- **Pagination**: Use `--start` to offset into results. `--max` controls how many PMIDs ESearch retrieves (and thus how many summaries are fetched).
- **Search syntax**: PubMed's full query syntax is supported in `--query`: Boolean operators (AND, OR, NOT), field tags ([ti], [ab], [mh], [au], [pt], [dp], etc.), MeSH terms, date ranges, wildcards.
