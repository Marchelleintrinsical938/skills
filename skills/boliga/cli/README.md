# boliga-cli

CLI for the [Boliga.dk](https://www.boliga.dk) public property API.

**Base URL**: `https://api.boliga.dk/api/v2/`
**Authentication**: None required.
**Format**: All responses are JSON.

---

## Installation

```bash
cd skills/boliga/cli
bun install
```

---

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for-sale properties |
| `sold` | Search sold properties |
| `detail` | Full detail for a single listing |
| `property` | Comprehensive address data (BBR, history, valuations) |
| `suggestions` | Location autocomplete |
| `stats` | Real-time market snapshot |
| `prices` | Quarterly price index (historical) |
| `mostviewed` | Top viewed active listings |

All commands accept `--format json|table|plain` (default: `json`).
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Property Types

| Code | Danish | English |
|------|--------|---------|
| 1 | Villa | Detached house |
| 2 | Rækkehus | Townhouse / terraced house |
| 3 | Ejerlejlighed | Owner-occupied apartment |
| 4 | Fritidshus | Holiday home |
| 5 | Andelsbolig | Co-operative housing |
| 6 | Helårsgrund | Residential plot |
| 7 | Fritidsgrund | Holiday plot |
| 8 | Landejendom | Farm / rural property |
| 9 | Andet | Other |

---

## `search` — Search for-sale properties

**Endpoint**: `GET /api/v2/search/results`

```bash
bun run src/cli.ts search [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--zip-codes` | string | — | Comma-separated zip codes, e.g. `2100,2200` |
| `--municipality` | number | — | Municipality code, e.g. `101` for Copenhagen |
| `--property-type` | number | — | Property type code (1–9) |
| `--price-min` | number | — | Minimum price in DKK |
| `--price-max` | number | — | Maximum price in DKK |
| `--size-min` | number | — | Minimum size in m² |
| `--size-max` | number | — | Maximum size in m² |
| `--rooms` | number | — | Number of rooms |
| `--build-year-min` | number | — | Minimum build year |
| `--build-year-max` | number | — | Maximum build year |
| `--energy-class` | string | — | Comma-separated energy classes, e.g. `a,b,c` |
| `--sort` | string | `date-d` | Sort order (see below) |
| `--page` | number | `1` | Page number |
| `--page-size` | number | `10` | Results per page (max ~100) |
| `--limit` | number | — | Cap total results returned by CLI |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Sort options

| Value | Description |
|-------|-------------|
| `date-d` | Newest listings first (default) |
| `views-d` | Most viewed first |
| `price-a` | Price low to high |
| `price-d` | Price high to low |
| `sqmPrice-a` | Price per m² low to high |
| `sqmPrice-d` | Price per m² high to low |
| `daysForSale-d` | Longest on market first |

### Example

```bash
bun run src/cli.ts search \
  --zip-codes 2100 \
  --property-type 3 \
  --price-min 2000000 \
  --price-max 6000000 \
  --sort price-a \
  --page-size 5
```

### Response shape

```json
{
  "meta": {
    "searchGuid": "8c1ccade-eafe-4590-b27d-5a05129791ba",
    "totalCount": 130,
    "totalPages": 65,
    "pageIndex": 1,
    "pageSize": 2,
    "minPage": 1,
    "maxPage": 6,
    "showBanners": true
  },
  "results": [
    {
      "id": 2305987,
      "latitude": 55.7141,
      "longitude": 12.57125,
      "propertyType": 3,
      "priceChangePercentTotal": 0,
      "energyClass": "C",
      "openHouse": "",
      "price": 3995000,
      "selfsale": false,
      "rooms": 2.0,
      "size": 44,
      "lotSize": 386,
      "floor": 4,
      "buildYear": 1903,
      "city": "København Ø",
      "isForeclosure": false,
      "isActive": true,
      "municipality": 101,
      "zipCode": 2100,
      "street": "Kildevældsgade 73, 4. tv.",
      "squaremeterPrice": 90795.0,
      "area": 1,
      "daysForSale": 9,
      "createdDate": "2026-03-03T14:30:10.677Z",
      "isPremiumAgent": false,
      "net": 0,
      "exp": 0,
      "basementSize": 0,
      "inWatchlist": false,
      "views": 127,
      "agentRegId": 432,
      "domainId": 9,
      "guid": "E97BECF0-E15C-4908-A0BB-FE7564E2BC4E",
      "agentDisplayName": "",
      "groupKey": null,
      "downPayment": 200000,
      "itemType": 0,
      "projectSaleUrl": null,
      "additionalBuildings": null,
      "lastSeen": "2026-03-12T00:31:20.747Z",
      "businessArea": null,
      "nonPremiumDiscrete": false,
      "bfeNr": 151562,
      "ouId": 127163721,
      "ouAddress": "kildevaeldsgade-73-4-tv-2100-koebenhavn-oe",
      "onTheWay": false,
      "cleanStreet": "Kildevældsgade",
      "otwAddress": null,
      "dsAddress": null,
      "boligaPlus": false,
      "showLogo": false,
      "randomTypeHuse": null,
      "ouIsFavorite": false,
      "useOuFlag": false,
      "lastSoldDate": null,
      "evaluationPrice": 0.0,
      "priceChangeCashTotal": 0,
      "secondaryPropertyType": null,
      "lastSoldPrice": 0,
      "lastSeenPrice": 0
    }
  ]
}
```

> **Note**: `maxPage` in the response is capped at 6 (a display limitation). `totalPages` and `totalCount` are accurate.

> **Note**: The API may also return `images` and `dawaId` inline within each search result object (not just in `detail`). The example above shows a representative subset of fields; additional fields may appear depending on the listing.

---

## `sold` — Search sold properties

**Endpoint**: `GET /api/v2/sold/search/results`

```bash
bun run src/cli.ts sold [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--zip-codes` | string | — | Comma-separated zip codes |
| `--municipality` | number | — | Municipality code |
| `--property-type` | number | — | Property type code (1–9) |
| `--price-min` | number | — | Minimum sold price in DKK |
| `--price-max` | number | — | Maximum sold price in DKK |
| `--size-min` | number | — | Minimum size in m² |
| `--size-max` | number | — | Maximum size in m² |
| `--rooms` | number | — | Number of rooms |
| `--build-year-min` | number | — | Minimum build year |
| `--build-year-max` | number | — | Maximum build year |
| `--sort` | string | `soldDate-d` | Sort order: `soldDate-d`, `price-d`, `price-a`, `sqmPrice-d` |
| `--page` | number | `1` | Page number |
| `--page-size` | number | `10` | Results per page |
| `--limit` | number | — | Cap total results returned by CLI |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

> **Warning**: `soldDate-a` (ascending sold date) returns HTTP 500 from the API. Use `soldDate-d` or omit `--sort`.

> **Note on `--zip-codes`**: The sold API endpoint does not natively support zip code filtering. When `--zip-codes` is provided, the CLI fetches pages of up to 100 results at a time and filters client-side, paginating until the requested number of matching results is collected (max 20 API pages). This means `--zip-codes` with `sold` may be slower than with `search`.

### Example

```bash
bun run src/cli.ts sold \
  --zip-codes 2100,2200 \
  --property-type 3 \
  --page-size 5 \
  --format table
```

### Response shape

```json
{
  "meta": {
    "pageIndex": 1,
    "pageSize": 2,
    "totalCount": 1807002,
    "totalPages": 903501,
    "minPage": 1,
    "maxPage": 6,
    "countFrom": 1,
    "countTo": 2
  },
  "results": [
    {
      "estateId": 0,
      "address": "Skolevej 17K",
      "zipCode": 4632,
      "price": 2295000,
      "soldDate": "2026-03-10T23:00:00.000Z",
      "propertyType": 2,
      "saleType": "Alm. Salg",
      "sqmPrice": 21250.0,
      "rooms": 3.0,
      "size": 108,
      "buildYear": 1987,
      "change": 0.0,
      "guid": "7FF735B7-451E-4B4D-A1E0-3FBB93C52862",
      "latitude": 55.45817,
      "longitude": 12.026777,
      "municipalityCode": 259,
      "estateCode": 157195,
      "city": "Bjæverskov",
      "groupKey": null,
      "canGetVR": true,
      "bfEnr": 271784,
      "ouId": 1994900778,
      "ouAddress": "skolevej-17k-4632-bjaeverskov"
    }
  ]
}
```

> **Note**: `change` is the percentage difference between asking price and sold price (negative = sold below asking).

---

## `detail` — Full listing detail

**Endpoint**: `GET /api/v2/estate/{id}`

```bash
bun run src/cli.ts detail <id> [--format json|plain]
```

The `id` is the numeric estate ID from `search` results (the `id` field).

### Example

```bash
bun run src/cli.ts detail 2243737
bun run src/cli.ts detail 2243737 --format plain
```

### Response shape

All fields from `search` results, plus:

```json
{
  "id": 2243737,
  "registeredArea": 174,
  "downPayment": 1050000,
  "estateUrl": "https://www.lilienhoff.dk/liebhaber/30030000107?utm_source=boliga",
  "currentArchiveId": 2243737,
  "forSaleNowId": 0,
  "foreclosureId": 0,
  "selfsaleEstateId": 0,
  "cadastral": "13gs~12751|13km~12751",
  "cleanStreet": "Kongshvilebakken",
  "selfSaleImages": [],
  "premiumImages": [],
  "guid": "CDAB357F-439F-486B-BE49-111D8A2A3D8B",
  "inspiire": null,
  "estateId": 0,
  "dawaId": null,
  "canGetVR": true,
  "hasActiveFacebookCatalog": false,
  "dsb": { "name": "Lyngby St.", "x": 12.503, "y": 55.770 },
  "dinGeoUrl": "https://www.dingeo.dk/adresse/2800-lyngby/...",
  "bfeNr": 8777625,
  "showBanners": true,
  "adresseId": "0A3F50A4-6184-32B8-E044-0003BA298018",
  "canGet5G": true,
  "link5G": "https://www.3.dk/internet/...",
  "canGet4G": false,
  "link4G": "",
  "agentInfo": {
    "id": 29407,
    "name": "Lilienhoff",
    "adress": "...",
    "phone": "...",
    "email": "...",
    "homepage": "...",
    "logo": "...",
    "allowPhotosInBoliga": true,
    "premium": false,
    "latitude": 55.77,
    "longtitude": 12.47,
    "description": "...",
    "agentDisplayName": "",
    "active": true
  },
  "images": [
    {
      "id": 2243737,
      "date": "2026-03-12T23:19:55.000Z",
      "url": "https://i.boliga.org/dk/550x/2243/2243737.jpg"
    }
  ],
  "additionalBuildings": [],
  "latitude": 55.77253,
  "longitude": 12.47891,
  "propertyType": 1,
  "price": 20950000,
  "rooms": 8.0,
  "size": 174,
  "lotSize": 1457,
  "floor": null,
  "buildYear": 1956,
  "city": "Kongens Lyngby",
  "zipCode": 2800,
  "street": "Kongshvilebakken 54",
  "squaremeterPrice": 120402.0,
  "daysForSale": 244,
  "createdDate": "2025-07-10T22:35:02.490Z",
  "net": 90612,
  "exp": 10722,
  "basementSize": 150,
  "views": 56565,
  "ouId": 1052179426,
  "ouAddress": "kongshvilebakken-54-2800-kongens-lyngby",
  "priceChangePercentTotal": -9,
  "priceChangeCashTotal": 2050000,
  "energyClass": "b",
  "isForeclosure": false,
  "isActive": true,
  "municipality": 159
}
```

---

## `property` — Comprehensive address data

**Endpoint**: `GET /api/v2/oneurl/{ouId}`

```bash
bun run src/cli.ts property <ouId> [--format json|plain]
```

The `ouId` (ownership unit ID) is a **stable identifier for a physical address** that persists across multiple listing cycles. It is returned as the `ouId` field in all search and detail responses.

### Example

```bash
bun run src/cli.ts property 1052179426
```

### Response shape

```json
{
  "estate": [
    {
      "...": "same shape as detail endpoint"
    }
  ],
  "bbr": {
    "unitId": "string",
    "isSalesValid": true,
    "isActive": true,
    "addressString": "Kongshvilebakken 54, 2800 Kongens Lyngby",
    "gadeString": "Kongshvilebakken 54",
    "hus_nr": "54",
    "etagebetegn": null,
    "side_Doernr": null,
    "zipString": "2800",
    "zipCodeString": "2800 Kongens Lyngby",
    "imageUrl": "https://i.boliga.org/dk/550x/...",
    "isApartment": false,
    "propertyType": 1,
    "municipalityCode": 159,
    "esrCode": "...",
    "lat": 55.77253,
    "lon": 12.47891,
    "isBlocked": false,
    "isInSalesAgent": false,
    "isInWatchlist": false,
    "isCoop": false,
    "addressFloor": null,
    "watchlistNote": null,
    "ejendomsværdiskat": 0,
    "grundskyld": 0,
    "canGetVR": true,
    "propertyTypeName": "Villa",
    "bbrInfoBox": { "...": "..." },
    "relatedImages": [],
    "buildingInfo": { "...": "construction details" },
    "unitInfo": { "...": "unit / apartment details" },
    "ownerShipInfo": { "...": "ownership type" },
    "lotInfo": { "...": "land parcel details" },
    "cadastralInfos": [],
    "additionalBuldingInfos": [],
    "floorInfos": [],
    "additionalFloorInfos": [],
    "salesInfos": [],
    "evaluationInfos": [],
    "esrOwnershipInfo": []
  },
  "sold": {
    "canGetVR": true,
    "userHasEvalReport": false,
    "isActive": true,
    "currentEstateId": 2243737,
    "address": "Kongshvilebakken 54",
    "addressObj": {
      "street": "Kongshvilebakken",
      "number": "54",
      "zipCode": 2800
    },
    "zipCode": 2800,
    "city": "Kongens Lyngby",
    "coordinates": {
      "latitude": 55.77253,
      "longitude": 12.47891
    },
    "guid": "CDAB357F-439F-486B-BE49-111D8A2A3D8B",
    "propertyType": 1,
    "sales": [],
    "previousListings": [],
    "soldAgentInfo": null,
    "ouId": 1052179426,
    "ouAddress": "kongshvilebakken-54-2800-kongens-lyngby"
  },
  "discrete": null,
  "ouIsFavorite": false,
  "lastSeenDate": "2020-09-07T00:00:00.000Z",
  "lastListingPrice": 15500000,
  "lastSoldDate": "2020-07-29T00:00:00.000Z",
  "lastSalesPrice": 14400000,
  "discountAvg": 1.8,
  "squaremeterPriceAvg": 70828
}
```

---

## `suggestions` — Location autocomplete

**Endpoint**: `GET /api/v2/location/suggestions`

```bash
bun run src/cli.ts suggestions --query <text> [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--query` | string | **required** | Search text (address, street, city, zip code) |
| `--area-limit` | number | `10` | Max number of area suggestions |
| `--address-limit` | number | `10` | Max number of address/listing suggestions |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Example

```bash
bun run src/cli.ts suggestions --query "Kongshvilebakken" --area-limit 5
```

### Response shape

```json
{
  "boligSuggestions": [
    {
      "id": 2243737,
      "street": "Kongshvilebakken 54",
      "zipCode": 2800,
      "city": "Kongens Lyngby",
      "propertyType": 1,
      "ouId": 1052179426,
      "unitId": "CDAB357F-439F-486B-BE49-111D8A2A3D8B",
      "ouAddress": "kongshvilebakken-54-2800-kongens-lyngby",
      "useOuFlag": false
    }
  ],
  "areaSuggestions": [
    {
      "id": 274255,
      "name": "Kongshvilebakken, 2800 Lyngby",
      "street": "440",
      "place": null,
      "zipCode": "2800",
      "municipality": "159",
      "region": null,
      "areaId": 0,
      "type": 50
    }
  ],
  "boligSuggestionsTotalCount": 1,
  "boligNFSSuggestions": [],
  "boligNFSSuggestionsTotalCount": 0
}
```

**Area suggestion `type` values**: `20` = municipality, `30` = place, `40` = zip code, `50` = street, `60` = area/region.

---

## `stats` — Real-time market snapshot

**Endpoint**: `GET /api/v2/frontpage/stats`

```bash
bun run src/cli.ts stats [--format json|plain]
```

### Example

```bash
bun run src/cli.ts stats
bun run src/cli.ts stats --format plain
```

### Response shape

```json
{
  "propertiesForSale": 42552,
  "newToday": 733,
  "priceDropToday": 144,
  "newForeClosuresToday": 8,
  "newSelfsale24h": 2,
  "moreThanOtherPortals": 695,
  "selfsaleNumber": 7900,
  "discreteNumber": 332,
  "onthewayNumber": 0
}
```

---

## `prices` — Quarterly price index

**Endpoint**: `GET /api/v2/statistics/historicalprices`

```bash
bun run src/cli.ts prices [flags]
```

Returns quarterly RKR (Realkreditrådet) price index data. Without filters, returns national data (~135 quarters back to ~1992).

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--property-type` | number | — | Filter by property type (1=Villa, 3=Apartment, etc.) |
| `--area-type` | string | — | Area type: `zip` |
| `--area-id` | string | — | Area ID, e.g. zip code `2100` |
| `--limit` | number | — | Cap number of data points returned |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Example

```bash
# National villa prices
bun run src/cli.ts prices --property-type 1

# Apartments in zip 2100, last 10 quarters
bun run src/cli.ts prices --property-type 3 --area-type zip --area-id 2100 --limit 10
```

### Response shape

```json
{
  "data": [
    {
      "rkrQuarterData": {
        "date": "2025-09-30T00:00:00",
        "value": 18007.0,
        "changeSinceLastQuarter": 0.5,
        "changeSinceLastYear": 6.2,
        "changeSince1995": 347.8
      }
    }
  ],
  "areaList": [
    {
      "id": 21000,
      "rrIdentifier": "1000",
      "rrText": "1000-1499 Kbh.K.",
      "eiText": "1000-1499 Kbh.K.",
      "sort": 21000
    }
  ],
  "salesPricesChartData": [
    {
      "id": 1783097,
      "quarter": {
        "id": 1,
        "date": "1992-03-31T00:00:00"
      },
      "area": 0,
      "dataType": 0,
      "propertyType": 0,
      "value": 4021.0
    }
  ]
}
```

> `value` in `rkrQuarterData` is the index price in kr/m².

---

## `mostviewed` — Top viewed listings

**Endpoint**: `GET /api/v2/statistics/mostviewed`

```bash
bun run src/cli.ts mostviewed [flags]
```

### Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--page` | number | `1` | Page number |
| `--page-size` | number | `25` | Results per page |
| `--limit` | number | — | Cap total results returned by CLI |
| `--format` | string | `json` | Output format: `json`, `table`, `plain` |

### Example

```bash
bun run src/cli.ts mostviewed --page-size 10 --format table
```

### Response shape

Returns a flat array (no `meta` wrapper):

```json
[
  {
    "imgUrl": "https://i.boliga.org/dk/500x/230/2305532.jpg",
    "url": "bolig/2305532/enghavevej_72_st_1_1674_koebenhavn_v",
    "title": "Andelsbolig i København V",
    "adress": "Enghavevej 72, st.. 1., 1674 København V",
    "propertyTypeName": "Andelsbolig",
    "rooms": 2,
    "size": 48,
    "propertyTypeId": 5,
    "price": 1395000,
    "viewCount": 359,
    "zipCode": 1674,
    "id": 2305532,
    "city": "København V"
  }
]
```

> Unlike other list endpoints, `mostviewed` returns a bare JSON array — no `meta` or `results` wrapper.

---

## Error handling

All errors are written to **stderr** in JSON format and exit with code `1`:

```json
{ "error": "Property not found", "code": "NOT_FOUND" }
{ "error": "API request failed: 500 Internal Server Error", "code": "API_ERROR" }
{ "error": "--query is required", "code": "MISSING_REQUIRED" }
```

---

## URL construction

Property pages on boliga.dk:
- For-sale: `https://www.boliga.dk/bolig/{id}/{ouAddress}`
- Address view: `https://www.boliga.dk/adresse/{ouAddress}-{ouId}`

Property images: `https://i.boliga.org/dk/550x/{first4digits}/{id}.jpg`
