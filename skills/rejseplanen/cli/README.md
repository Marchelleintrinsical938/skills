# Rejseplanen CLI

CLI for Danish public transport journey planning via the [Rejseplanen API 2.0](https://www.rejseplanen.dk).

## Authentication

All requests require an `accessId` query parameter. The CLI reads it from the `REJSEPLANEN_ACCESS_ID` environment variable.

### How to obtain an access ID

1. Go to the [Rejseplanen API access page](https://help.rejseplanen.dk/hc/da/articles/214174465-Adgang-til-Rejseplanens-API)
2. Fill out the request form with your name, email, and a brief description of your use case
3. Rejseplanen will email you an access ID (typically within a few business days)
4. The access ID is a string token (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

Once you have your access ID, set it as an environment variable:

```bash
export REJSEPLANEN_ACCESS_ID=your_access_id_here
```

To make it permanent, add the export to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).

## API Base URL

```
https://www.rejseplanen.dk/api/
```

All requests include `format=json` to get JSON responses.

---

## Commands

### `location` — Search stops/stations

Search for stops, addresses, and points of interest by name.

**API endpoint:** `GET /location.name`

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--query` | string | yes | — | Search string |
| `--max` | number | no | 10 | Max results (1-50) |
| `--type` | string | no | ALL | Filter: S=stop, A=address, P=POI, ALL=all |
| `--format` | string | no | json | Output format: json, table, plain |

**API parameters mapping:**
- `--query` → `input`
- `--max` → `maxNo`
- `--type` → `type`

**JSON output:**

```json
{
  "type": "rejseplanen_location",
  "query": "København",
  "locations": [
    {
      "id": "8600626",
      "name": "København H",
      "lat": 55.672778,
      "lon": 12.564444,
      "type": "ST"
    }
  ],
  "count": 1
}
```

Location types: `"ST"` (stop/station), `"ADR"` (address), `"POI"` (point of interest).

The API returns locations in `stopLocationOrCoordLocation` array. Each entry is either a `StopLocation` (with `extId`, `name`, coordinates) or a `CoordLocation` (with `name`, coordinates, `type`).

---

### `trip` — Plan a journey

Plan a trip between two locations.

**API endpoint:** `GET /trip`

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--origin` | string | yes | — | Origin stop ID or name |
| `--destination` | string | yes | — | Destination stop ID or name |
| `--date` | string | no | today | Travel date (YYYY-MM-DD) |
| `--time` | string | no | now | Travel time (HH:MM) |
| `--arrive-by` | boolean | no | false | Search by arrival time |
| `--results` | number | no | 5 | Number of trips (1-6) |
| `--no-fares` | boolean | no | false | Exclude fare/pricing (fares included by default) |
| `--via` | string | no | — | Via stop ID or name |
| `--stops` | boolean | no | false | Show intermediate stops for each leg |
| `--scroll` | string | no | — | Scroll token for earlier/later results |
| `--format` | string | no | json | Output format: json, table, plain |

**API parameters mapping:**
- If `--origin` looks like a stop ID (digits only), use `originExtId` directly; otherwise resolve via `/location.name` first
- If `--destination` looks like a stop ID, use `destExtId` directly; otherwise resolve via `/location.name` first
- `--date` → `date` (YYYY-MM-DD)
- `--time` → `time` (HH:MM)
- `--arrive-by` → `searchForArrival=1`
- `--results` → `numF` (forward results)
- `--via` → resolve via `/location.name` if name, then `viaExtId`
- `--scroll` → `ctx`
- Fares are included by default; use `--no-fares` to exclude

**JSON output:**

```json
{
  "type": "rejseplanen_trip",
  "origin": "København H",
  "destination": "Aarhus H",
  "via": "Odense",
  "date": "2026-03-20",
  "time": "08:00",
  "trips": [
    {
      "origin": "København H",
      "destination": "Aarhus H",
      "departure": "08:12",
      "arrival": "11:23",
      "duration": "3:11",
      "changes": 0,
      "legs": [
        {
          "name": "IC 123",
          "type": "IC",
          "origin": "København H",
          "destination": "Aarhus H",
          "departure": "08:12",
          "arrival": "11:23",
          "track": "7",
          "direction": "Aarhus H",
          "cancelled": false,
          "delayed": false,
          "delayMinutes": 0,
          "rtDeparture": null,
          "rtArrival": null,
          "notes": [],
          "stops": []
        }
      ],
      "fares": [
        {
          "passenger": "Adult",
          "product": "EasyTrip",
          "class": "Standard",
          "price": 416.00,
          "currency": "DKK"
        },
        {
          "passenger": "Child",
          "product": "EasyTrip",
          "class": "Standard",
          "price": 208.00,
          "currency": "DKK"
        }
      ]
    }
  ],
  "tripCount": 1,
  "scrollEarlier": "B|T|...",
  "scrollLater": "F|T|..."
}
```

The `fares` array is included by default. Use `--no-fares` to exclude it. Prices are Rejsekort EasyTrip standard class fares in DKK. Passenger types: Adult, Child, Pensioner, Youth, Halvpris (half-price card holder).

The `via` field is only present when `--via` is used. The `stops` array in each leg is populated when `--stops` is passed, showing intermediate stops with name, arrival/departure times, and track. The `scrollEarlier` and `scrollLater` tokens can be passed back via `--scroll` to paginate through results.

The API returns `Trip` array. Each Trip has a `LegList.Leg` array. Each leg has `Origin`, `Destination`, `Product` (name, line, catOutL), `direction`, `cancelled`, real-time data (`rtDepTime`, `rtArrTime`), track info, `delayed` (boolean), `delayMinutes` (computed from real-time vs scheduled), and `notes` (array of `{type, text}` objects — same types as departures/arrivals). The scroll context is returned in `scrB` (earlier) and `scrF` (later) on the response.

For walking legs, `type` is `"WALK"` and `name` is `"Walk"`.

Duration is calculated as difference between first leg departure and last leg arrival.

---

### `departures` — Departure board

Show upcoming departures from a stop.

**API endpoint:** `GET /departureBoard`

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--stop` | string | yes | — | Stop ID |
| `--date` | string | no | today | Date (YYYY-MM-DD) |
| `--time` | string | no | now | Time (HH:MM) |
| `--duration` | number | no | 60 | Time window in minutes (0-1439) |
| `--max` | number | no | 20 | Max results |
| `--format` | string | no | json | Output format: json, table, plain |

**API parameters mapping:**
- `--stop` → `id`
- `--date` → `date` (YYYY-MM-DD)
- `--time` → `time` (HH:MM)
- `--duration` → `duration`
- `--max` → `maxJourneys`

**JSON output:**

```json
{
  "type": "rejseplanen_departures",
  "stop": "8600626",
  "date": "2026-03-20",
  "time": "08:00",
  "departures": [
    {
      "name": "IC 123",
      "line": "IC",
      "direction": "Aarhus H",
      "date": "2026-03-20",
      "time": "08:12",
      "rtDate": null,
      "rtTime": null,
      "track": "7",
      "cancelled": false,
      "stopId": "8600626",
      "delayed": false,
      "delayMinutes": 0,
      "notes": []
    }
  ],
  "count": 1
}
```

The API returns `Departure` array (or `DepartureBoard.Departure`). Each has `name`, `line` (from Product), `direction`, `date`, `time`, `rtDate`, `rtTime`, `track`, `cancelled`, `stopId`, `delayed` (boolean), `delayMinutes` (computed from real-time vs scheduled), and `notes` (array of `{type, text}` objects). Note types: `"bike"` (from API key `FR`), `"accessibility"` (from API key `BE`), `"info"` (all others). Internal notes (API type `I`) are filtered out.

---

### `arrivals` — Arrival board

Show upcoming arrivals at a stop.

**API endpoint:** `GET /arrivalBoard`

**Flags:**

Same as `departures`.

**JSON output:**

```json
{
  "type": "rejseplanen_arrivals",
  "stop": "8600626",
  "date": "2026-03-20",
  "time": "08:00",
  "arrivals": [
    {
      "name": "IC 456",
      "line": "IC",
      "origin": "Aarhus H",
      "date": "2026-03-20",
      "time": "11:23",
      "rtDate": null,
      "rtTime": null,
      "track": "7",
      "cancelled": false,
      "stopId": "8600626",
      "delayed": false,
      "delayMinutes": 0,
      "notes": []
    }
  ],
  "count": 1
}
```

The API returns `Arrival` array (or `ArrivalBoard.Arrival`). Same structure as departures but with `origin` instead of `direction`. Includes `delayed` (boolean), `delayMinutes` (computed from real-time vs scheduled), and `notes` (array of `{type, text}` objects). Note types: `"bike"` (from API key `FR`), `"accessibility"` (from API key `BE`), `"info"` (all others).

---

### `nearby` — Find nearby stops

Find stops and stations near given coordinates.

**API endpoint:** `GET /location.nearbystops`

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--lat` | number | yes | — | Latitude |
| `--lon` | number | yes | — | Longitude |
| `--radius` | number | no | 1000 | Search radius in meters |
| `--max` | number | no | 10 | Max results |
| `--format` | string | no | json | Output format |

**API parameters mapping:**
- `--lat` → `originCoordLat`
- `--lon` → `originCoordLong`
- `--radius` → `maxDist`
- `--max` → `maxNo`

**JSON output:**

```json
{
  "type": "rejseplanen_nearby",
  "lat": 55.672736,
  "lon": 12.565558,
  "radius": 1000,
  "stops": [
    {
      "id": "8600626",
      "name": "København H",
      "lat": 55.672736,
      "lon": 12.565558,
      "dist": 120,
      "type": "ST"
    }
  ],
  "count": 1
}
```

---

### `disruptions` — Service alerts

Show current service disruptions and travel alerts.

**API endpoint:** `GET /himSearch`

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--stop` | string | no | — | Filter by stop ID |
| `--line` | string | no | — | Filter by line ID |
| `--date` | string | no | today | Date (YYYY-MM-DD) |
| `--time` | string | no | now | Time (HH:MM) |
| `--max` | number | no | 20 | Max results |
| `--format` | string | no | json | Output format |

**API parameters mapping:**
- `--stop` → `stationId`
- `--line` → `lineId`
- `--date` → `dateB` and `dateE`
- `--time` → `timeB` and `timeE`
- `--max` → `maxNum`

**JSON output:**

```json
{
  "type": "rejseplanen_disruptions",
  "date": "2026-03-18",
  "disruptions": [
    {
      "id": "HIM_123",
      "subject": "Sporarbejde København H - Ringsted",
      "message": "Full disruption text...",
      "priority": 2,
      "startDate": "2026-03-18",
      "startTime": "04:00",
      "endDate": "2026-03-20",
      "endTime": "23:59",
      "affectedStops": ["København H", "Ringsted St."],
      "affectedLines": ["IC", "Re"]
    }
  ],
  "count": 1
}
```

The API returns `him.message` array. Each message has `head` (subject), `text` (full message), `priority`, date/time range, and optional `affectedStops.StopLocation` and `affectedLines.Line` arrays.

---

## Error handling

All errors are written to stderr as JSON and exit with code 1:

```json
{ "error": "REJSEPLANEN_ACCESS_ID environment variable is not set", "code": "AUTH_ERROR" }
```

Error codes:
- `AUTH_ERROR` — Missing access ID
- `MISSING_REQUIRED` — Missing required flag
- `API_ERROR` — API request failed
- `PARSE_ERROR` — Failed to parse API response

---

## API date/time format

The API 2.0 uses ISO format for dates (`YYYY-MM-DD`) and `HH:MM:SS` for times. The CLI passes dates through as-is and truncates times to `HH:MM` in output.
