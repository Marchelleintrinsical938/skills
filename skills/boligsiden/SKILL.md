---
name: boligsiden
version: 1.0.0
description: >
  Make sure to use this skill whenever the user mentions anything related to Danish
  real estate, property prices, housing market in Denmark, apartments or houses for
  sale or rent in Denmark, sold properties, municipal data, or housing statistics —
  even if they don't explicitly mention boligsiden.dk. Also use it when they ask
  about specific Danish cities or areas in a housing context. Trigger phrases include:
  danish property, danish housing market, boligsiden, danish real estate, houses for
  sale in denmark, apartments for sale in denmark, rental properties in denmark, sold
  homes in denmark, property prices in denmark, danish municipalities, ejendom, bolig
  til salg, lejebolig, solgte boliger, boligpriser, boligsøgning, ejerlejlighed,
  villa, rækkehus, sommerhus, andelsbolig, house prices copenhagen, aarhus real
  estate, odense housing.
context: fork
allowed-tools: Bash(bun run skills/boligsiden/cli/src/cli.ts *)
---

# Boligsiden Skill

Access live Danish property data from Boligsiden.dk's public API. No authentication needed.

## When to use this skill

Invoke this skill whenever the user wants to:
- Search for homes, apartments, or other properties for sale in Denmark
- Find rental properties in Denmark
- Look up recent property sales or sold prices in a Danish area
- Get the price history / timeline for a specific listing
- Find out about Danish municipalities (population, tax rates)
- Autocomplete or validate a Danish location name or zip code
- Analyse the Danish housing market (price ranges, days on market, etc.)

## Commands

### Search for-sale properties

```bash
bun run skills/boligsiden/cli/src/cli.ts search [flags]
```

Common flags:
- `--municipalities <names>` — e.g. `København,Frederiksberg`
- `--cities <names>` — e.g. `Østerbro`
- `--zip-codes <codes>` — e.g. `2100,2200`
- `--address-types <types>` — `villa`, `condo`, `terraced house`, `holiday house`, `cooperative`, `farm`, `hobby farm`, `full year plot`, `villa apartment`, `holiday plot`, `houseboat`
- `--min-price / --max-price` — DKK
- `--min-area / --max-area` — m²
- `--min-rooms / --max-rooms`
- `--sort-by` — `price`, `timeOnMarket`, `createdAt`, `date`, `random`
- `--sort-ascending`
- `--page / --per-page / --limit`
- `--format` — `json` (default), `table`, `plain`

### Search rentals

```bash
bun run skills/boligsiden/cli/src/cli.ts rentals [flags]
```

Same location and size filters as `search`. `--min-price`/`--max-price` refer to monthly rent.

### Search sold properties

```bash
bun run skills/boligsiden/cli/src/cli.ts sold [flags]
```

Extra flags:
- `--sold-months-back <n>` — how far back to look (default 12)
- `--radius <metres>` — radial search around a single location
- `--sort-by date` — default sort for sold listings

### Full property detail

```bash
bun run skills/boligsiden/cli/src/cli.ts detail <caseID> [--format json|plain]
```

### Price history for a listing

```bash
bun run skills/boligsiden/cli/src/cli.ts timeline <caseID> [--format json|table|plain]
```

### Location autocomplete

```bash
bun run skills/boligsiden/cli/src/cli.ts locations --text "<query>" [--limit 10] [--format json|table|plain]
```

### List municipalities

```bash
bun run skills/boligsiden/cli/src/cli.ts municipalities [--limit n] [--format json|table|plain]
```

---

## How to use effectively

**Start with `locations` to get the right slug.** The search commands require exact Danish location names. Use `locations --text "<query>"` first to resolve what the user typed into a valid slug before passing it to `--municipalities` or `--cities`.

**Natural workflow: `search` → `detail` → `timeline`.** Use `search` (or `rentals`/`sold`) to get a list of matching `caseID`s, then call `detail <caseID>` to inspect a specific property, and `timeline <caseID>` to see its full price history.

**Format choice matters.**
- `--format table` gives a quick human-readable overview — use this for summaries and comparisons.
- `--format json` (default) is best for data processing or when you need to extract specific fields.
- `--format plain` is ideal for single-record detail views (`detail`, `timeline`).

**Pagination: `--limit` vs `--per-page`.**
- `--per-page` controls how many results the API returns per request (server-side).
- `--limit` caps the total results the CLI outputs regardless of what the API returned (client-side).
- Use `--limit` for quick overviews; use `--page` + `--per-page` for iterating through large result sets.

---

## Usage examples

### Find the right location name before searching

```bash
bun run skills/boligsiden/cli/src/cli.ts locations --text "Nørrebro" --format plain
```

### Find cheap condos in Copenhagen

```bash
bun run skills/boligsiden/cli/src/cli.ts search \
  --municipalities København \
  --address-types condo \
  --max-price 2500000 \
  --sort-by price \
  --sort-ascending \
  --format table
```

### Find rentals in Aarhus under 10.000 DKK/month

```bash
bun run skills/boligsiden/cli/src/cli.ts rentals \
  --municipalities Aarhus \
  --max-price 10000 \
  --min-rooms 2 \
  --format table
```

### What sold recently near zip 8000?

```bash
bun run skills/boligsiden/cli/src/cli.ts sold \
  --zip-codes 8000 \
  --sold-months-back 3 \
  --sort-by date \
  --format table
```

### Inspect a specific listing

```bash
bun run skills/boligsiden/cli/src/cli.ts detail abc123 --format plain
```

### See if a listing has had price drops

```bash
bun run skills/boligsiden/cli/src/cli.ts timeline abc123 --format table
```

### Compare municipality tax rates

```bash
bun run skills/boligsiden/cli/src/cli.ts municipalities --format table
```

---

## Output formats

| Format | Best for |
|---|---|
| `json` | Programmatic use, default for all commands |
| `table` | Human-readable summaries in the terminal |
| `plain` | Key/value detail views, easy to scan |

All errors are written to stderr as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Notes

- All data comes from the public `api.boligsiden.dk` REST API — no credentials required.
- Pagination is 1-indexed (`--page 1` is the first page).
- `--limit` caps the number of results returned by the CLI regardless of what the API returns.
- Property type values use English slugs (e.g. `condo`, not `ejerlejlighed`); use `locations` to resolve Danish place names.
