# medrxiv-cli

CLI for searching [medRxiv](https://www.medrxiv.org) medical preprints via the free Cold Spring Harbor Laboratory API (`api.medrxiv.org`). No API key, no signup, no cost.

**Base URL**: `https://api.medrxiv.org/details/medrxiv`
**Authentication**: None required.
**Format**: All responses are JSON.

---

## Installation

```bash
cd skills/medrxiv-search/cli
bun install
```

---

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search preprints by keyword within a date range |
| `doi` | Look up a specific paper by DOI |
| `categories` | List all available medRxiv categories |

All commands output JSON by default.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## `search` — Search preprints by keyword

Fetches all papers from the last N days, filters client-side by keyword match in title and abstract, then ranks by number of keyword hits.

> **Note**: The medRxiv API does not support keyword search natively. The CLI fetches all papers in the date range and filters locally. Broader date ranges fetch more data and take longer. Use `--days 7` for fast searches.

```bash
bun run src/cli.ts search --query <keywords> [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--query` | string | **required** | Keywords to search (space-separated) |
| `--days` | number | `30` | Number of days back to search |
| `--max` | number | `20` | Maximum results to return |
| `--category` | string | — | Filter by medRxiv category (exact match, case-insensitive) |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Examples

```bash
bun run src/cli.ts search --query "heart failure treatment" --days 30 --max 20
bun run src/cli.ts search --query "diabetes" --category "epidemiology" --days 90
bun run src/cli.ts search --query "COVID vaccine efficacy" --days 7 --max 50
```

### Response shape

```json
{
  "success": true,
  "type": "medrxiv_search",
  "query": "heart failure treatment",
  "days": 30,
  "date_range": {
    "from": "2025-01-10",
    "to": "2025-02-09"
  },
  "total_fetched": 4523,
  "result_count": 12,
  "results": [
    {
      "doi": "10.1101/2025.01.15.25320585",
      "title": "Paper Title",
      "authors": "Smith, J.; Doe, A.",
      "author_corresponding": "Smith, J.",
      "institution": "University Hospital",
      "date": "2025-01-16",
      "version": "1",
      "category": "cardiovascular medicine",
      "abstract": "Background: ...",
      "published": "NA",
      "url": "https://www.medrxiv.org/content/10.1101/2025.01.15.25320585v1"
    }
  ]
}
```

### How it works

1. Calculates the date range from `--days`
2. Fetches all papers in that range, paginating in pages of 100
3. Applies `--category` filter client-side (if provided)
4. Filters by keyword match in title + abstract
5. Ranks by number of keyword hits (most relevant first)
6. Returns top `--max` results

---

## `doi` — Look up a paper by DOI

Returns all versions of a specific paper.

```bash
bun run src/cli.ts doi <doi> [--format json|plain]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `doi` | The DOI string, e.g. `10.1101/2024.12.26.24319649` |

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--format` | string | `json` | Output format: `json`, `plain` |

### Example

```bash
bun run src/cli.ts doi 10.1101/2024.12.26.24319649
bun run src/cli.ts doi 10.1101/2024.12.26.24319649 --format plain
```

### Response shape

```json
{
  "success": true,
  "type": "medrxiv_doi",
  "doi": "10.1101/2024.12.26.24319649",
  "version_count": 2,
  "results": [
    {
      "doi": "10.1101/2024.12.26.24319649",
      "title": "Paper Title",
      "authors": "Smith, J.; Doe, A.",
      "author_corresponding": "Smith, J.",
      "institution": "University Hospital",
      "date": "2024-12-27",
      "version": "1",
      "category": "infectious diseases",
      "abstract": "Background: ...",
      "published": "NA",
      "url": "https://www.medrxiv.org/content/10.1101/2024.12.26.24319649v1"
    }
  ]
}
```

---

## `categories` — List all medRxiv categories

Returns the full list of medRxiv subject categories that can be used with `search --category`.

```bash
bun run src/cli.ts categories [--format json|plain]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--format` | string | `json` | Output format: `json`, `plain` |

### Example

```bash
bun run src/cli.ts categories
bun run src/cli.ts categories --format plain
```

### Response shape

```json
{
  "success": true,
  "type": "medrxiv_categories",
  "count": 51,
  "categories": [
    "addiction medicine",
    "allergy and immunology",
    "anesthesia",
    "cardiovascular medicine",
    "dentistry and oral medicine",
    "dermatology",
    "emergency medicine",
    "endocrinology",
    "epidemiology",
    "forensic medicine",
    "gastroenterology",
    "genetic and genomic medicine",
    "geriatric medicine",
    "health economics",
    "health informatics",
    "health policy",
    "health systems and quality improvement",
    "hematology",
    "hiv/aids",
    "infectious diseases",
    "intensive care and critical care medicine",
    "medical education",
    "medical ethics",
    "nephrology",
    "neurology",
    "nursing",
    "nutrition",
    "obstetrics and gynecology",
    "occupational and environmental health",
    "oncology",
    "ophthalmology",
    "orthopedics",
    "otolaryngology",
    "pain medicine",
    "palliative medicine",
    "pathology",
    "pediatrics",
    "pharmacology and therapeutics",
    "primary care research",
    "psychiatry and clinical psychology",
    "public and global health",
    "radiology and imaging",
    "rehabilitation medicine and physical therapy",
    "respiratory medicine",
    "rheumatology",
    "sexual and reproductive health",
    "sports medicine",
    "surgery",
    "toxicology",
    "transplantation",
    "urology"
  ]
}
```

---

## Error handling

All errors are written to **stderr** in JSON format and exit with code `1`:

```json
{ "error": "--query is required", "code": "MISSING_REQUIRED" }
{ "error": "DOI is required", "code": "MISSING_REQUIRED" }
{ "error": "API request failed: 503 Service Unavailable", "code": "API_ERROR" }
```

---

## API reference

- **Search (date range)**: `GET https://api.medrxiv.org/details/medrxiv/{dateFrom}/{dateTo}/{cursor}/json`
  - Returns up to 100 papers per page; `cursor` is 0-indexed offset
  - Response: `{ messages: [{ status, total }], collection: [...] }`
- **DOI lookup**: `GET https://api.medrxiv.org/details/medrxiv/{doi}/na/json`
  - Returns all versions of the paper
  - Response: `{ messages: [...], collection: [...] }`

### Paper fields from API

Each paper in `collection` has these fields (mapped to output shape):

| API field | Output field | Description |
|-----------|-------------|-------------|
| `doi` | `doi` | DOI string |
| `title` | `title` | Paper title |
| `authors` | `authors` | Author list string |
| `author_corresponding` | `author_corresponding` | Corresponding author |
| `author_corresponding_institution` | `institution` | Corresponding author's institution |
| `date` | `date` | Publication date (YYYY-MM-DD) |
| `version` | `version` | Version number string |
| `category` | `category` | medRxiv category |
| `abstract` | `abstract` | Full abstract text |
| `published` | `published` | Journal DOI if published, else "NA" |
| _(computed)_ | `url` | `https://www.medrxiv.org/content/{doi}v{version}` |
