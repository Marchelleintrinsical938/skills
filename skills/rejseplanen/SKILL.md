---
name: rejseplanen
version: 1.0.0
description: >
  Make sure to use this skill whenever the user asks about public transport in Denmark,
  train schedules, bus times, metro departures, journey planning between Danish cities,
  or travel routes using Danish public transport — even if they just ask how to get from
  one place to another in Denmark without naming Rejseplanen specifically.
  Also use this skill when the user asks about departures or arrivals at a Danish station,
  next train/bus/metro from a stop, or wants to look up a Danish transit stop or station.
  Trigger phrases include: rejseplanen, offentlig transport, tog, bus, metro, s-tog, letbane,
  rejse, afgange, ankomster, køreplan, how to get from, next train, next bus, departures from,
  arrivals at, rejsetid, togplan, bustider, DSB, Movia, Midttrafik, Nordjyllands Trafikselskab,
  FynBus, Sydtrafik, offentlig transport Danmark, public transport Denmark, Danish train,
  Danish bus, hvornår kører, hvordan kommer jeg til, find station, find stop,
  disruptions, driftsforstyrrelser, forsinkelser, delays, nearby stops, nærmeste stationer,
  cykel, bike access, wheelchair, kørestol, stoppesteder i nærheden.
context: fork
allowed-tools: Bash(bun run skills/rejseplanen/cli/src/cli.ts *)
---

# Rejseplanen Public Transport Skill

Plan journeys, check departures/arrivals, and search for stops/stations across all Danish public transport (trains, buses, metro, light rail) via the [Rejseplanen API](https://www.rejseplanen.dk). Requires an API access ID — users must set the `REJSEPLANEN_ACCESS_ID` environment variable.

## Setup

### How to obtain `REJSEPLANEN_ACCESS_ID`

1. Go to the [Rejseplanen API access page](https://help.rejseplanen.dk/hc/da/articles/214174465-Adgang-til-Rejseplanens-API)
2. Fill out the request form with your name, email, and a brief description of your use case
3. Rejseplanen will email you an access ID (typically within a few business days)
4. Set it as an environment variable:

```bash
export REJSEPLANEN_ACCESS_ID=your_access_id_here
```

To make it permanent, add the export line to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).

If `REJSEPLANEN_ACCESS_ID` is not set, the CLI will exit with a clear error message.

## When to use this skill

Invoke this skill when the user wants to:

- Plan a journey between two locations in Denmark (e.g., "How do I get from Aarhus to Copenhagen?")
- Check ticket prices / fares for a journey (included by default in trip output)
- Check upcoming departures from a Danish stop/station
- Check upcoming arrivals at a Danish stop/station
- Search for a stop or station by name
- Look up train, bus, metro, or light rail schedules in Denmark
- Check service disruptions, delays, or travel alerts
- Find nearby stops/stations by coordinates
- Check real-time delay information for departures/arrivals
- Check bike or wheelchair accessibility for a journey

## Commands

### Search for stops/stations

```bash
bun run skills/rejseplanen/cli/src/cli.ts location --query <name> [flags]
```

Key flags:
- `--query <name>` — Search string (required)
- `--max <n>` — Max results (default: 10)
- `--type <S|A|P|ALL>` — Filter by type: S=stop, A=address, P=POI, ALL=all (default: ALL)
- `--format json|table|plain`

### Plan a trip

```bash
bun run skills/rejseplanen/cli/src/cli.ts trip --origin <id-or-name> --destination <id-or-name> [flags]
```

Key flags:
- `--origin <id-or-name>` — Origin stop ID or name (required)
- `--destination <id-or-name>` — Destination stop ID or name (required)
- `--date <YYYY-MM-DD>` — Travel date (default: today)
- `--time <HH:MM>` — Travel time (default: now)
- `--arrive-by` — Search for arrival time instead of departure
- `--results <n>` — Number of trip results, 1-6 (default: 5)
- `--no-fares` — Exclude fare/pricing (fares included by default)
- `--via <id-or-name>` — Via stop ID or name
- `--stops` — Show intermediate stops for each leg
- `--scroll <token>` — Scroll token for pagination (use scrollEarlier/scrollLater from output)
- `--format json|table|plain`

### Check departures from a stop

```bash
bun run skills/rejseplanen/cli/src/cli.ts departures --stop <id> [flags]
```

Key flags:
- `--stop <id>` — Stop ID from location search (required)
- `--date <YYYY-MM-DD>` — Date (default: today)
- `--time <HH:MM>` — Time (default: now)
- `--duration <minutes>` — Time window in minutes, 0-1439 (default: 60)
- `--max <n>` — Max results (default: 20)
- `--format json|table|plain`

### Check arrivals at a stop

```bash
bun run skills/rejseplanen/cli/src/cli.ts arrivals --stop <id> [flags]
```

Same flags as `departures`.

### Find nearby stops

```bash
bun run skills/rejseplanen/cli/src/cli.ts nearby --lat <latitude> --lon <longitude> [flags]
```

Key flags:
- `--lat <n>` — Latitude (required)
- `--lon <n>` — Longitude (required)
- `--radius <meters>` — Search radius (default: 1000)
- `--max <n>` — Max results (default: 10)
- `--format json|table|plain`

### Check service disruptions

```bash
bun run skills/rejseplanen/cli/src/cli.ts disruptions [flags]
```

Key flags:
- `--stop <id>` — Filter by stop ID
- `--line <name>` — Filter by line
- `--date <YYYY-MM-DD>` — Date (default: today)
- `--time <HH:MM>` — Time (default: now)
- `--max <n>` — Max results (default: 20)
- `--format json|table|plain`

---

## Natural workflow: location -> trip / departures / arrivals / nearby / disruptions

1. Use `location` to find a stop and get its ID, or use `nearby` to find stops near coordinates
2. Use `trip` to plan a journey between two stops (fares included by default)
3. Use `departures`/`arrivals` to check schedules and real-time delays
4. Use `disruptions` to check for service alerts before traveling

```bash
# Step 1: find stop IDs
bun run skills/rejseplanen/cli/src/cli.ts location --query "København H"
bun run skills/rejseplanen/cli/src/cli.ts location --query "Aarhus H"

# Step 1 (alt): find nearby stops by coordinates
bun run skills/rejseplanen/cli/src/cli.ts nearby --lat 55.6727 --lon 12.5655

# Step 2: plan a trip (fares included by default)
bun run skills/rejseplanen/cli/src/cli.ts trip --origin "8600626" --destination "8600079"

# Step 3: check departures
bun run skills/rejseplanen/cli/src/cli.ts departures --stop "8600626"

# Step 4: check disruptions
bun run skills/rejseplanen/cli/src/cli.ts disruptions
```

---

## Usage examples

### Find a station

```bash
bun run skills/rejseplanen/cli/src/cli.ts location --query "Nørreport"
```

### Plan a trip from Copenhagen to Aarhus

```bash
bun run skills/rejseplanen/cli/src/cli.ts trip --origin "København H" --destination "Aarhus H" --date 2026-03-20 --time 08:00
```

### Next departures from København H

```bash
bun run skills/rejseplanen/cli/src/cli.ts departures --stop "8600626" --duration 30
```

### Arrivals at Odense in table format

```bash
bun run skills/rejseplanen/cli/src/cli.ts arrivals --stop "8600067" --format table
```

### Find stops near a location

```bash
bun run skills/rejseplanen/cli/src/cli.ts nearby --lat 55.6727 --lon 12.5655 --radius 500
```

### Check current disruptions

```bash
bun run skills/rejseplanen/cli/src/cli.ts disruptions
```

### Trip with intermediate stops via Odense

```bash
bun run skills/rejseplanen/cli/src/cli.ts trip --origin "København H" --destination "Aarhus H" --via "Odense" --stops
```

---

## JSON output shapes

### location output

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

### trip output

```json
{
  "type": "rejseplanen_trip",
  "origin": "København H",
  "destination": "Aarhus H",
  "date": "2026-03-20",
  "time": "08:00",
  "via": "Odense",
  "scrollEarlier": "token...",
  "scrollLater": "token...",
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
          "rtDeparture": null,
          "rtArrival": null,
          "delayed": true,
          "delayMinutes": 5,
          "notes": [{"type": "bike", "text": "Cykel reservation påkrævet"}],
          "stops": [{"name": "Høje Taastrup St.", "arrival": "08:27", "departure": "08:28"}]
        }
      ]
    }
  ],
  "tripCount": 1
}
```

### departures output

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
      "delayed": true,
      "delayMinutes": 5,
      "notes": [{"type": "bike", "text": "Cykel reservation påkrævet"}]
    }
  ],
  "count": 1
}
```

### arrivals output

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
      "delayed": true,
      "delayMinutes": 5,
      "notes": [{"type": "bike", "text": "Cykel reservation påkrævet"}]
    }
  ],
  "count": 1
}
```

### nearby output

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

### disruptions output

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

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, full data |
| `table` | Quick human-readable overview |
| `plain` | Easy reading of individual items |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.
