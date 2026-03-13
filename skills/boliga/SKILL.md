---
name: boliga
version: 1.0.0
description: >
  Make sure to use this skill whenever the user mentions anything related to Danish
  property data, housing prices, real estate statistics, sold homes, property history,
  BBR data, or the Danish housing market — even if they don't mention boliga.dk
  explicitly. Also invoke this skill for questions about specific Danish addresses,
  zip codes, or municipalities in a housing context. Trigger phrases include:
  danish property, danish real estate, danish housing market, boliga, bolig til salg,
  solgte boliger, boligpriser, ejendomspriser, ejendom, ejerlejlighed, villa,
  rækkehus, sommerhus, fritidshus, andelsbolig, helårsgrund, landejendom,
  BBR data, bygningsregistret, property for sale denmark, sold homes denmark,
  house prices denmark, apartment prices copenhagen, aarhus housing, odense real
  estate, housing statistics denmark, quarterly price index denmark, most viewed
  properties denmark, property valuation denmark, ejendomsvurdering, salgspris,
  kvadratmeterpris, days on market, dage til salg, boligsøgning, address lookup
  denmark, property history denmark.
context: fork
allowed-tools: Bash(bun run skills/boliga/cli/src/cli.ts *)
---

# Boliga Skill

Access live Danish property data from the Boliga.dk public API. No authentication needed.
Covers ~42,000 active listings, ~1.8 million sold records, and comprehensive BBR building data.

## When to use this skill

Invoke this skill when the user wants to:

- Search for homes, apartments, or other properties currently for sale in Denmark
- Find recent property sales and sold prices in a Danish area or address
- Look up the full history of a specific Danish address (BBR, prior sales, valuations)
- Get real-time Danish housing market statistics (total listings, price drops, new today)
- Analyse historical price trends by property type, zip code, or area
- Find the most-viewed active listings on the market
- Autocomplete or resolve a Danish address, street, zip code, or city name
- Compare asking price vs. sold price (the `change` field in sold results)

## Commands

### Search for-sale properties

```bash
bun run skills/boliga/cli/src/cli.ts search [flags]
```

Key flags:
- `--zip-codes <codes>` — e.g. `2100,2200`
- `--municipality <code>` — e.g. `101` for Copenhagen
- `--property-type <code>` — 1=Villa, 2=Townhouse, 3=Apartment, 4=Holiday, 5=Co-op, 6=Residential plot, 7=Holiday plot, 8=Farm, 9=Other
- `--price-min / --price-max` — DKK
- `--size-min / --size-max` — m²
- `--rooms <n>`
- `--build-year-min / --build-year-max`
- `--energy-class <classes>` — e.g. `a,b,c`
- `--sort <order>` — `date-d` (default), `views-d`, `price-a`, `price-d`, `sqmPrice-a`, `sqmPrice-d`, `daysForSale-d`
- `--page / --page-size / --limit`
- `--format json|table|plain`

### Search sold properties

```bash
bun run skills/boliga/cli/src/cli.ts sold [flags]
```

Same location/size/type filters as `search`, plus:
- `--sort` — `soldDate-d` (default), `price-d`, `price-a`, `sqmPrice-d`

> Do not use `soldDate-a` — the API returns HTTP 500 for ascending sold date sort.

> When using `--zip-codes` with `sold`, filtering is done client-side (the API does not support it natively). The CLI fetches in batches of 100 and filters locally — it may be slower than `search` with zip codes.

### Full listing detail

```bash
bun run skills/boliga/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the numeric estate ID from `search` results. Returns full listing with agent info, images, connectivity data (4G/5G), and cadastral info.

### Comprehensive address data (BBR + history + valuations)

```bash
bun run skills/boliga/cli/src/cli.ts property <ouId> [--format json|plain]
```

`ouId` is the ownership unit ID — stable across listing cycles, returned as `ouId` in all search/detail results. This endpoint returns everything about a physical address: current listing, BBR building data, all prior sales, all prior listings, and official valuations.

### Location autocomplete

```bash
bun run skills/boliga/cli/src/cli.ts suggestions --query "<text>" [--area-limit 10] [--address-limit 10]
```

Use this to resolve an address, street, city, or zip code into structured IDs before passing them to other commands.

### Market snapshot

```bash
bun run skills/boliga/cli/src/cli.ts stats [--format json|plain]
```

Returns real-time counts: total for-sale listings, new today, price drops today, foreclosures, etc.

### Quarterly price index

```bash
bun run skills/boliga/cli/src/cli.ts prices [--property-type <n>] [--area-type zip] [--area-id <zip>] [--limit <n>]
```

RKR (Realkreditrådet) quarterly data back to ~1992. Filter by property type and zip code area.

### Most viewed listings

```bash
bun run skills/boliga/cli/src/cli.ts mostviewed [--page <n>] [--page-size <n>] [--limit <n>]
```

---

## How to use effectively

**Resolve locations first.** Use `suggestions` to find the correct zip code or municipality code before passing them to `search` or `sold`:

```bash
bun run skills/boliga/cli/src/cli.ts suggestions --query "Nørrebro" --format plain
```

**Natural workflow: `search` → `detail` → `property`.**
1. Use `search` to get a list of matching estates with their `id` and `ouId`.
2. Call `detail <id>` to get the full listing with agent info and images.
3. Call `property <ouId>` to get the complete address history (all prior sales, BBR data, valuations).

**Use `--format table` for comparisons**, `--format json` for data processing, and `--format plain` for single-record detail views.

**Pagination**: `--page-size` controls server-side results per page. `--limit` caps what the CLI outputs regardless of page size. Use `--page` + `--page-size` to iterate through large result sets.

**ouId vs id**: `id` identifies a specific listing (changes each time a property is re-listed). `ouId` identifies the physical address and is stable — use it for `property` to get the full history.

---

## Usage examples

### What's for sale in Copenhagen's 2100 zip code?

```bash
bun run skills/boliga/cli/src/cli.ts search \
  --zip-codes 2100 \
  --sort date-d \
  --page-size 10 \
  --format table
```

### Apartments under 3M DKK in Copenhagen

```bash
bun run skills/boliga/cli/src/cli.ts search \
  --municipality 101 \
  --property-type 3 \
  --price-max 3000000 \
  --sort price-a \
  --format table
```

### What sold recently in Aarhus?

```bash
bun run skills/boliga/cli/src/cli.ts sold \
  --zip-codes 8000,8200,8210 \
  --sort soldDate-d \
  --page-size 10 \
  --format table
```

### Full history of a specific address

```bash
# First find the ouId from search results, then:
bun run skills/boliga/cli/src/cli.ts property 1052179426 --format plain
```

### How have villa prices trended nationally?

```bash
bun run skills/boliga/cli/src/cli.ts prices --property-type 1 --limit 20 --format table
```

### What are apartment prices in zip 2200?

```bash
bun run skills/boliga/cli/src/cli.ts prices \
  --property-type 3 \
  --area-type zip \
  --area-id 2200 \
  --limit 8 \
  --format table
```

### Current market overview

```bash
bun run skills/boliga/cli/src/cli.ts stats --format plain
```

### Most talked-about listings right now

```bash
bun run skills/boliga/cli/src/cli.ts mostviewed --page-size 10 --format table
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, data processing, passing IDs between commands |
| `table` | Quick human-readable overviews and comparisons |
| `plain` | Single-record detail views (`detail`, `property`, `stats`) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Notes

- All data is from the public `api.boliga.dk` REST API — no credentials required.
- Pagination is 1-indexed (`--page 1` is the first page).
- The `maxPage` field in API responses is capped at 6 (display limitation); `totalPages` and `totalCount` are accurate.
- `mostviewed` returns a bare JSON array — no `meta` wrapper.
- The `change` field in sold results is the % difference between asking price and sold price.
- Property images: `https://i.boliga.org/dk/550x/{first4digits}/{id}.jpg`
