import { describe, test, expect, beforeAll } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface TimelineEvent {
  at: string;
  price?: number;
  type: string;
}

interface TimelineResult {
  timeline: TimelineEvent[];
}

interface SearchResult {
  cases: Array<{ caseID: string }>;
  totalHits: number;
}

let knownCaseID: string;

beforeAll(async () => {
  // Sort by timeOnMarket descending to get listings that have been on the market longest —
  // these are most likely to have timeline events (price changes, re-listings, etc.)
  const result = await runCLI([
    "search",
    "--sort-by",
    "timeOnMarket",
    "--sort-ascending",
    "false",
    "--per-page",
    "5",
  ]);
  const data = parseJSON<SearchResult>(result);
  if (data.cases.length === 0) {
    throw new Error("No cases returned from search — cannot run timeline tests");
  }

  // Try each candidate in order until we find one with at least 1 timeline event
  for (const candidate of data.cases) {
    const tlResult = await runCLI(["timeline", candidate.caseID]);
    try {
      const tlData = parseJSON<{ timeline: unknown[] }>(tlResult);
      if (tlData.timeline && tlData.timeline.length > 0) {
        knownCaseID = candidate.caseID;
        break;
      }
    } catch {
      // skip invalid responses
    }
  }

  if (!knownCaseID) {
    // Fall back to first candidate — tests that require events will fail with a clear message
    knownCaseID = data.cases[0].caseID;
  }
});

describe("timeline command", () => {
  test("returns valid JSON with timeline array", async () => {
    const result = await runCLI(["timeline", knownCaseID]);
    const data = parseJSON<TimelineResult>(result);

    expect(data).toHaveProperty("timeline");
    expect(Array.isArray(data.timeline)).toBe(true);
  });

  test("timeline events have expected fields", async () => {
    const result = await runCLI(["timeline", knownCaseID]);
    const data = parseJSON<TimelineResult>(result);

    // The beforeAll hook selects a listing guaranteed to have events
    expect(data.timeline.length).toBeGreaterThan(0);
    for (const event of data.timeline) {
      expect(event).toHaveProperty("at");
      expect(event).toHaveProperty("type");
      expect(typeof event.at).toBe("string");
      expect(typeof event.type).toBe("string");
    }
  });

  test("timeline event 'at' is a valid date string", async () => {
    const result = await runCLI(["timeline", knownCaseID]);
    const data = parseJSON<TimelineResult>(result);

    // The beforeAll hook selects a listing guaranteed to have events
    expect(data.timeline.length).toBeGreaterThan(0);
    for (const event of data.timeline) {
      const d = new Date(event.at);
      expect(isNaN(d.getTime())).toBe(false);
    }
  });

  test("exits with non-zero code for invalid caseID", async () => {
    const result = await runCLI(["timeline", "invalid-case-id-000000"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("exits with non-zero code when caseID is missing", async () => {
    const result = await runCLI(["timeline"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("outputs table format without error", async () => {
    const result = await runCLI(["timeline", knownCaseID, "--format", "table"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("outputs plain format without error", async () => {
    const result = await runCLI(["timeline", knownCaseID, "--format", "plain"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
