# boligsiden-cli

A command-line interface for the public Boligsiden.dk API — Denmark's largest property portal. Search for-sale homes, rentals, and sold properties, inspect price history, and browse municipalities, all from the terminal.

Base API: `https://api.boligsiden.dk`
Authentication: none required

---

## Installation

```bash
bun install
```

## Usage

```
bun run src/cli.ts <command> [flags]
```

---

## Commands

### `search` — Search for-sale properties

Search active listings on the Danish housing market.

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--municipalities` | string | — | Comma-separated municipality names (e.g. `København,Aarhus`) |
| `--cities` | string | — | Comma-separated city names |
| `--zip-codes` | string | — | Comma-separated zip codes (e.g. `2100,2200`) |
| `--address-types` | string | — | Comma-separated property types (see types below) |
| `--min-price` | number | — | Minimum asking price (DKK) |
| `--max-price` | number | — | Maximum asking price (DKK) |
| `--min-area` | number | — | Minimum living area (m²) |
| `--max-area` | number | — | Maximum living area (m²) |
| `--min-rooms` | number | — | Minimum number of rooms |
| `--max-rooms` | number | — | Maximum number of rooms |
| `--sort-by` | string | `createdAt` | Sort field: `price`, `timeOnMarket`, `random`, `createdAt`, `date` |
| `--sort-ascending` | boolean | `false` | Sort ascending instead of descending |
| `--page` | number | `1` | Page number (1-indexed) |
| `--per-page` | number | `20` | Results per page (max 100) |
| `--limit` | number | — | Cap total results returned (overrides `--per-page` when smaller) |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Property types** (for `--address-types`):
`villa`, `condo`, `terraced house`, `holiday house`, `cooperative`, `farm`, `hobby farm`, `full year plot`, `villa apartment`, `holiday plot`, `houseboat`

**Example**

```bash
# All condos in Copenhagen under 3M DKK, table view
bun run src/cli.ts search \
  --municipalities København \
  --address-types condo \
  --max-price 3000000 \
  --sort-by price \
  --sort-ascending \
  --format table

# JSON output, paginated
bun run src/cli.ts search --zip-codes 8000 --page 2 --per-page 10
```

**JSON output shape**

```json
{
  "cases": [
    {
      "caseID": "049e85c5-2b20-4a44-b76f-a1a30695fd67",
      "slug": "papiroeen-21-10-th-1436-koebenhavn-k-01010042__21_10__th",
      "addressType": "condo",
      "address": {
        "addressID": "3ef9ab3c-22e9-46f3-afb1-1d7337789a1b",
        "roadName": "Papirøen",
        "houseNumber": "21",
        "floor": "10",
        "door": "th",
        "zipCode": 1436,
        "cityName": "København K",
        "municipality": {
          "municipalityCode": 101,
          "name": "København"
        }
      },
      "priceCash": 34500000,
      "perAreaPrice": 147436,
      "priceChangePercentage": 15,
      "monthlyExpense": null,
      "housingArea": 234,
      "lotArea": null,
      "numberOfRooms": 6,
      "yearBuilt": 2023,
      "energyLabel": "a2015",
      "daysOnMarket": 1262,
      "hasBalcony": true,
      "hasElevator": true,
      "hasTerrace": false,
      "realtor": {
        "name": "home a/s",
        "realtorID": "home-a-s"
      }
    }
  ],
  "totalHits": 4521
}
```

**Table output** (one row per property):

```
caseID                               address                              type    price        area   rooms  days
049e85c5-2b20-4a44-b76f-a1a30695fd67 Papirøen 21, 1436 København K       condo   34.500.000   234m²  6      1262
```

---

### `rentals` — Search rental properties

Search active rental listings.

**Flags**

Shares all location and size flags from `search`, plus:

| Flag | Type | Default | Description |
|---|---|---|---|
| `--municipalities` | string | — | Comma-separated municipality names |
| `--cities` | string | — | Comma-separated city names |
| `--zip-codes` | string | — | Comma-separated zip codes |
| `--address-types` | string | — | Property types |
| `--min-price` | number | — | Minimum monthly rent (DKK) |
| `--max-price` | number | — | Maximum monthly rent (DKK) |
| `--min-area` | number | — | Minimum area (m²) |
| `--max-area` | number | — | Maximum area (m²) |
| `--min-rooms` | number | — | Minimum rooms |
| `--max-rooms` | number | — | Maximum rooms |
| `--sort-by` | string | `createdAt` | Sort field: `price`, `timeOnMarket`, `createdAt`, `date` |
| `--sort-ascending` | boolean | `false` | Sort ascending |
| `--page` | number | `1` | Page number |
| `--per-page` | number | `20` | Results per page |
| `--limit` | number | — | Cap total results returned |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
# Rentals in Aarhus, max 10.000 DKK/month, at least 3 rooms
bun run src/cli.ts rentals \
  --municipalities Aarhus \
  --max-price 10000 \
  --min-rooms 3 \
  --format table
```

**JSON output shape** — same envelope as `search` (`{ cases, totalHits }`), with `priceCash` representing monthly rent.

---

### `sold` — Search sold properties

Search address history and completed sales.

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--municipalities` | string | — | Comma-separated municipality names |
| `--cities` | string | — | Comma-separated city names |
| `--zip-codes` | string | — | Comma-separated zip codes |
| `--address-types` | string | — | Property types |
| `--sold-months-back` | number | `12` | How many months back to include sales |
| `--radius` | number | — | Search radius in metres (requires a single location) |
| `--min-price` | number | — | Minimum sold price (DKK) |
| `--max-price` | number | — | Maximum sold price (DKK) |
| `--min-area` | number | — | Minimum area (m²) |
| `--max-area` | number | — | Maximum area (m²) |
| `--sort-by` | string | `date` | Sort field: `price`, `date`, `distance` |
| `--sort-ascending` | boolean | `false` | Sort ascending |
| `--page` | number | `1` | Page number |
| `--per-page` | number | `20` | Results per page |
| `--limit` | number | — | Cap total results returned |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
# What sold in Odense over the last 6 months?
bun run src/cli.ts sold \
  --municipalities Odense \
  --sold-months-back 6 \
  --sort-by date \
  --format table

# Recent sales in zip 1000–1499
bun run src/cli.ts sold --zip-codes 1000,1100,1200,1300,1400 --limit 50
```

**JSON output shape**

```json
{
  "cases": [
    {
      "addressID": "0a3f50c0-ebef-32b8-e044-0003ba298018",
      "addressType": "villa",
      "roadName": "Gl. Hobrovej",
      "houseNumber": "101B",
      "zipCode": 8920,
      "cityName": "Randers NV",
      "municipality": {
        "municipalityCode": 730,
        "name": "Randers"
      },
      "livingArea": 196,
      "latestValuation": 1873000,
      "registrations": [
        {
          "registrationID": "18b9b6e0-1f4d-4741-9220-3e8ef5458d9f",
          "amount": 1995000,
          "date": "2026-03-10",
          "area": 196,
          "perAreaPrice": 8646,
          "type": "normal"
        }
      ]
    }
  ],
  "totalHits": 126690
}
```

The most recent sale price is found in `registrations[last].amount`. The `registrations` array is sorted oldest-first, so the last entry is the latest sale.

---

### `detail` — Full property detail

Fetch the complete data record for a single active listing by its `caseID`.

**Arguments**

```
bun run src/cli.ts detail <caseID>
```

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
bun run src/cli.ts detail 049e85c5-2b20-4a44-b76f-a1a30695fd67
bun run src/cli.ts detail 049e85c5-2b20-4a44-b76f-a1a30695fd67 --format plain
bun run src/cli.ts detail 049e85c5-2b20-4a44-b76f-a1a30695fd67 --format table
```

**JSON output shape**

The `detail` command returns the raw API response for the case. Key fields include:

```json
{
  "caseID": "049e85c5-2b20-4a44-b76f-a1a30695fd67",
  "slug": "papiroeen-21-10-th-1436-koebenhavn-k-01010042__21_10__th",
  "addressType": "condo",
  "address": {
    "addressID": "3ef9ab3c-22e9-46f3-afb1-1d7337789a1b",
    "roadName": "Papirøen",
    "houseNumber": "21",
    "floor": "10",
    "door": "th",
    "zipCode": 1436,
    "cityName": "København K",
    "coordinates": { "lat": 55.67896, "lon": 12.599317, "type": "EPSG4326" },
    "municipality": {
      "municipalityCode": 101,
      "name": "København"
    }
  },
  "priceCash": 34500000,
  "perAreaPrice": 147436,
  "priceChangePercentage": 15,
  "monthlyExpense": null,
  "housingArea": 234,
  "lotArea": null,
  "numberOfRooms": 6,
  "yearBuilt": 2023,
  "energyLabel": "a2015",
  "daysOnMarket": 1262,
  "hasBalcony": true,
  "hasElevator": true,
  "hasTerrace": false,
  "realtor": {
    "name": "home a/s",
    "realtorID": "home-a-s"
  },
  "images": [
    {
      "imageSources": [
        {
          "url": "https://images.boligsiden.dk/images/case/049e85c5.../600x400/img.webp",
          "size": { "width": 600, "height": 400 },
          "alt": "..."
        }
      ]
    }
  ]
}
```

**Plain output** — key/value pairs, one per line:

```
caseID:        049e85c5-2b20-4a44-b76f-a1a30695fd67
address:       Papirøen 21, 10. th, 1436 København K
type:          condo
price:         34.500.000 DKK
area:          234 m²
rooms:         6
built:         2023
energy:        a2015
days on market: 1262
realtor:       home a/s
```

**Table output** — field/value pairs:

```
field            value
caseID           049e85c5-2b20-4a44-b76f-a1a30695fd67
address          Papirøen 21, 10. th, 1436 København K
type             condo
price            34.500.000
area             234m²
rooms            6
built            2023
energy           a2015
days on market   1262
```

---

### `timeline` — Price history for a listing

Fetch the price change timeline for a case.

**Arguments**

```
bun run src/cli.ts timeline <caseID>
```

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
bun run src/cli.ts timeline 049e85c5-2b20-4a44-b76f-a1a30695fd67
bun run src/cli.ts timeline 049e85c5-2b20-4a44-b76f-a1a30695fd67 --format table
```

**JSON output shape**

```json
{
  "timeline": [
    {
      "at": "2022-09-27T11:35:31.810449Z",
      "caseID": "049e85c5-2b20-4a44-b76f-a1a30695fd67",
      "price": 30000000,
      "type": "open",
      "aux": null
    },
    {
      "at": "2023-06-07T08:04:42.777753Z",
      "caseID": "049e85c5-2b20-4a44-b76f-a1a30695fd67",
      "price": 30000000,
      "type": "closed",
      "aux": null
    },
    {
      "at": "2025-11-06T01:37:44.439288Z",
      "caseID": "049e85c5-2b20-4a44-b76f-a1a30695fd67",
      "price": 34500000,
      "type": "price_change",
      "aux": {
        "priceDifference": 4500000,
        "priceDifferencePercentage": 15
      }
    }
  ]
}
```

Each entry has:
- `at` — ISO 8601 timestamp of the event
- `type` — event type: `open`, `closed`, `price_change`
- `price` — listing price at this point in time
- `aux` — extra data for `price_change` events (`priceDifference`, `priceDifferencePercentage`), otherwise `null`

**Table output**:

```
at                        type       price
2022-09-27T11:35:31.810Z  open       30.000.000
2023-06-07T08:04:42.777Z  closed     30.000.000
2025-11-06T01:37:44.439Z  price_change 34.500.000
```

---

### `locations` — Autocomplete location search

Search for location suggestions (municipalities, cities, zip codes, roads, addresses) to use in other commands.

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--text` | string | — | Search query text (required) |
| `--limit` | number | `10` | Max results per category |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
bun run src/cli.ts locations --text "Østerbro"
bun run src/cli.ts locations --text "8000" --limit 5
bun run src/cli.ts locations --text "Nørrebro" --format plain
```

**JSON output shape**

```json
{
  "addresses": [
    {
      "caseID": "0d062ed1-4158-4015-9164-df3cfefb3df4",
      "name": "Københavnsvej 37, 3400 Hillerød"
    }
  ],
  "cities": [
    {
      "count": 324,
      "name": "København S",
      "slug": "koebenhavn-s"
    }
  ],
  "customAreas": [
    {
      "count": 1597,
      "name": "København By",
      "slug": "koebenhavn-by"
    }
  ],
  "municipalities": [
    {
      "count": 1156,
      "name": "København",
      "slug": "koebenhavn"
    }
  ],
  "places": [],
  "provinces": [
    {
      "count": 1413,
      "name": "Københavns omegn",
      "slug": "koebenhavns-omegn"
    }
  ],
  "roads": [
    {
      "count": 1,
      "name": "Københavnsvej, 3400 Hillerød",
      "slug": "koebenhavnsvej,-3400-hilleroed"
    }
  ],
  "zipCodes": []
}
```

The `--limit` flag applies independently to each category array. The response keys are: `addresses`, `cities`, `customAreas`, `municipalities`, `places`, `provinces`, `roads`, `zipCodes`.

**Table output** — one result per line grouped by category:

```
type            name
addresses       Københavnsvej 37, 3400 Hillerød
cities          København S
municipalities  København
```

**Plain output** — tab-separated `type\tname`:

```
addresses	Københavnsvej 37, 3400 Hillerød
cities	København S
municipalities	København
```

---

### `municipalities` — List all municipalities

List all 98 Danish municipalities with metadata.

**Flags**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--limit` | number | — | Cap number of results |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

**Example**

```bash
bun run src/cli.ts municipalities
bun run src/cli.ts municipalities --format table
bun run src/cli.ts municipalities --limit 10 --format plain
```

**JSON output shape**

```json
[
  {
    "code": 165,
    "name": "Albertslund",
    "population": 27677,
    "churchTaxPercentage": 0.8,
    "councilTaxPercentage": 25.6,
    "landValueTaxLevelPerThousand": 9.1,
    "regionCode": 1084,
    "slug": "albertslund"
  }
]
```

Note: the field is `code` (not `municipalityID`). `population` may be `null` for very small municipalities (e.g. Christiansø).

**Table output**:

```
code  name                       population  propTaxRate  landTaxRate
165   Albertslund                27677       25.6%        9.1‰
201   Allerød                    25962       25.3%        8‰
```

---

## Error handling

All commands exit with code `0` on success and `1` on error.

Error output goes to stderr as JSON:

```json
{ "error": "Case not found", "code": "NOT_FOUND" }
```

Common error codes:

| Code | Meaning |
|---|---|
| `NOT_FOUND` | The requested resource does not exist |
| `INVALID_PARAMS` | One or more query parameters are invalid |
| `FETCH_ERROR` | Network request to the API failed |
| `UNKNOWN` | Unexpected error |

---

## Property types reference

| CLI value | Danish |
|---|---|
| `villa` | Villa |
| `condo` | Ejerlejlighed |
| `terraced house` | Rækkehus |
| `holiday house` | Sommerhus |
| `cooperative` | Andelsbolig |
| `farm` | Landejendom |
| `hobby farm` | Hobby landbrug |
| `full year plot` | Helårsgrund |
| `villa apartment` | Villalejlighed |
| `holiday plot` | Sommergrund |
| `houseboat` | Husbåd |
