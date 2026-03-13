---
name: salling-food-waste
version: 1.0.0
description: >
  Make sure to use this skill whenever the user asks about food waste deals, madspild tilbud,
  discounted groceries near expiry, yellow-label products, cheap food items, last-chance food,
  or reduced-price items at Danish supermarkets — even if they just mention wanting cheap
  groceries or food waste near a ZIP code or city without naming Salling or a specific store.
  Also use this skill when the user asks about food waste at Netto, føtex, Bilka, Salling,
  BR, or any Salling Group store. Trigger phrases include: madspild, food waste, food waste
  tilbud, madspild netto, madspild bilka, madspild føtex, cheap food, discounted groceries,
  near-expiry food, reduced price groceries, yellow label, salling food waste, salling group
  tilbud, find food waste near me, food waste deals Copenhagen, madspild i nærheden, tilbud
  på dagligvarer, cheap grocery deals, netto tilbud, føtex tilbud, bilka tilbud, where can
  I find cheap food, what food waste is available near ZIP, food waste near zip code.
context: fork
allowed-tools: Bash(bun run skills/salling-food-waste/cli/src/cli.ts *)
---

# Salling Food Waste Skill

Find discounted food waste items at Salling Group stores (Netto, føtex, Bilka, Salling, BR) across Denmark via the [Salling Group API](https://developer.sallinggroup.com). Requires a free API key — users must set the `SALLING_API_KEY` environment variable.

## Setup

Get a free API key at [developer.sallinggroup.com](https://developer.sallinggroup.com) and set it as an environment variable:

```bash
export SALLING_API_KEY=your_api_key_here
```

If `SALLING_API_KEY` is not set, the CLI will exit with a clear error message.

## When to use this skill

Invoke this skill when the user wants to:

- Find food waste / madspild deals near a Danish ZIP code or GPS location
- See which stores have discounted items and how many are available
- Browse specific products at a store (prices, discounts, stock)
- Find cheap near-expiry groceries at Netto, føtex, Bilka, or Salling stores
- Compare food waste availability across nearby stores

## Commands

### Search for stores with food waste

```bash
bun run skills/salling-food-waste/cli/src/cli.ts search --zip <zip> [flags]
bun run skills/salling-food-waste/cli/src/cli.ts search --lat <lat> --lon <lon> [--radius <km>] [flags]
```

Key flags:
- `--zip <code>` — Danish ZIP code (e.g. `2200`, `8000`)
- `--lat <n>` and `--lon <n>` — GPS coordinates for geo search
- `--radius <km>` — Search radius in km (default: 5, only for geo search)
- `--format json|table|plain`

Must provide either `--zip` or both `--lat` and `--lon`.

### Get products at a specific store

```bash
bun run skills/salling-food-waste/cli/src/cli.ts products <storeId> [flags]
```

Key flags:
- `<storeId>` — **required** positional arg — the store ID from `search` results
- `--limit <n>` — cap number of products shown
- `--format json|table|plain`

---

## Natural workflow: search → products

1. Use `search` to find nearby stores and get their IDs
2. Use `products <storeId>` to see what discounted items are available at a specific store

```bash
# Step 1: find stores near ZIP 2200
bun run skills/salling-food-waste/cli/src/cli.ts search --zip 2200

# Step 2: get products for a store (use id from results)
bun run skills/salling-food-waste/cli/src/cli.ts products <storeId>
```

---

## Usage examples

### Find food waste near Copenhagen by ZIP

```bash
bun run skills/salling-food-waste/cli/src/cli.ts search --zip 2200
```

### Find food waste near GPS coordinates (Aarhus city center)

```bash
bun run skills/salling-food-waste/cli/src/cli.ts search --lat 56.1629 --lon 10.2039 --radius 3
```

### See all products at a specific store

```bash
bun run skills/salling-food-waste/cli/src/cli.ts products <storeId> --format plain
```

### See top 5 cheapest deals at a store

```bash
bun run skills/salling-food-waste/cli/src/cli.ts products <storeId> --limit 5
```

### Quick overview in table format

```bash
bun run skills/salling-food-waste/cli/src/cli.ts search --zip 8000 --format table
```

---

## JSON output shapes

### search output

```json
{
  "success": true,
  "type": "salling_food_waste_search",
  "query": { "zip": "2200" },
  "storeCount": 3,
  "stores": [
    {
      "id": "store-id-string",
      "name": "Netto Nørrebro",
      "brand": "netto",
      "address": "Nørrebrogade 1, 2200, København N",
      "itemCount": 12
    }
  ]
}
```

### products output

```json
{
  "success": true,
  "type": "salling_food_waste_products",
  "storeId": "store-id-string",
  "storeName": "Netto Nørrebro",
  "storeBrand": "netto",
  "productCount": 5,
  "products": [
    {
      "name": "Øko Mælk 1L",
      "category": "Mejeri",
      "newPrice": 5.0,
      "originalPrice": 10.0,
      "discount": 5.0,
      "percentDiscount": 50.0,
      "stock": 3,
      "stockUnit": "each",
      "image": "https://..."
    }
  ]
}
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, full data |
| `table` | Quick human-readable overview |
| `plain` | Easy reading of individual items |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.
