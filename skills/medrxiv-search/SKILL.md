---
name: medrxiv-search
version: 1.0.0
description: >
  Make sure to use this skill whenever the user asks about medical preprints, clinical
  research papers, epidemiology studies, public health research, or any biomedical
  literature that may be available as a preprint — even if they don't mention medRxiv
  explicitly. Also invoke this skill when the user wants to find the latest research on
  a medical topic before journal publication, look up a specific paper by DOI, or browse
  available research categories. Trigger phrases include: medrxiv, medical preprint,
  clinical preprint, preprint server, clinical research, epidemiology study, public health
  paper, infectious disease research, oncology preprint, cardiology study, neurology
  research, COVID research, vaccine efficacy study, clinical trial results, biomedical
  literature, latest medical research, unpublished medical study, preprint doi lookup,
  find medical paper, search medrxiv, medical research database, health research paper,
  preprint search, medrxiv search, find clinical study, research on disease, find papers
  about treatment, what's the latest research on, new studies about, recent publications
  on, preprint about.
context: fork
allowed-tools: Bash(bun run skills/medrxiv-search/cli/src/cli.ts *)
---

# medRxiv Search Skill

Search and retrieve medical preprints from [medRxiv](https://www.medrxiv.org) via the free Cold Spring Harbor Laboratory API (`api.medrxiv.org`). No API key, no signup, no cost. Covers all medRxiv preprints across 51 subject categories.

## When to use this skill

Invoke this skill when the user wants to:

- Find the latest preprints on a medical or clinical topic
- Look up a specific paper by its DOI (get all versions)
- Explore what research categories medRxiv covers
- Search for clinical trial results, epidemiology studies, or public health data
- Find unpublished or recently published research before it appears in journals
- Get abstracts and metadata for medical research papers

## Commands

### Search preprints by keyword

```bash
bun run skills/medrxiv-search/cli/src/cli.ts search --query "<keywords>" [flags]
```

Key flags:
- `--query <text>` — **required** — keywords to match in title and abstract
- `--days <n>` — date range to search (default: 30; use 7 for speed)
- `--max <n>` — maximum results to return (default: 20)
- `--category <name>` — filter by medRxiv category (use `categories` to list)
- `--format json|table|plain`

> The API does not support keyword search natively. The CLI fetches all papers in the date range and filters locally, ranking by keyword hit count. Use `--days 7` for fast searches; `--days 90` for comprehensive coverage.

### Look up a paper by DOI

```bash
bun run skills/medrxiv-search/cli/src/cli.ts doi <doi> [--format json|plain]
```

Returns all versions of the paper. `doi` is the raw DOI string, e.g. `10.1101/2024.12.26.24319649`.

### List all categories

```bash
bun run skills/medrxiv-search/cli/src/cli.ts categories [--format json|plain]
```

Returns the 51 medRxiv subject categories you can pass to `search --category`.

---

## How to use effectively

**Fast search:** Use `--days 7` to limit the date window and get results quickly. The CLI must paginate through all papers in the range before filtering.

**Targeted search:** Combine `--category` with `--query` to narrow results. For example, to find epidemiology papers about obesity:

```bash
bun run skills/medrxiv-search/cli/src/cli.ts search \
  --query "obesity prevalence" \
  --category "epidemiology" \
  --days 30 \
  --max 10
```

**DOI workflow:** If the user provides or mentions a DOI, go straight to `doi` — it returns all versions instantly without any date-range fetching.

**Category exploration:** Use `categories` first to confirm the exact category name spelling before filtering with `--category`.

**Natural workflow: search → doi**
1. Use `search` to find relevant papers and get their DOIs
2. Use `doi <doi>` to get full metadata including all versions of a specific paper

---

## Usage examples

### Find recent COVID vaccine research

```bash
bun run skills/medrxiv-search/cli/src/cli.ts search \
  --query "COVID vaccine efficacy" \
  --days 30 \
  --max 10
```

### Find epidemiology papers on diabetes (last 90 days)

```bash
bun run skills/medrxiv-search/cli/src/cli.ts search \
  --query "diabetes" \
  --category "epidemiology" \
  --days 90 \
  --max 20
```

### Get all versions of a paper by DOI

```bash
bun run skills/medrxiv-search/cli/src/cli.ts doi 10.1101/2024.12.26.24319649
```

### Browse available categories

```bash
bun run skills/medrxiv-search/cli/src/cli.ts categories --format plain
```

### Quick search with table output

```bash
bun run skills/medrxiv-search/cli/src/cli.ts search \
  --query "heart failure" \
  --days 7 \
  --format table
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, full metadata |
| `table` | Quick human-readable overviews |
| `plain` | Reading individual papers or categories |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Notes

- Data from the free `api.medrxiv.org` REST API — no credentials required
- Papers are paginated in batches of 100; the CLI fetches all pages automatically
- Results are ranked by keyword hit count (most mentions = higher rank)
- The `url` field gives the direct medRxiv link including version number
- `published` field shows the journal DOI if the paper was later published, otherwise `"NA"`
