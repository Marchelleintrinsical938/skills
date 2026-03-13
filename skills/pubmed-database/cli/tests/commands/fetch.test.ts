import { describe, test, expect } from "bun:test"
import { runCLI } from "../helpers"

// Well-known PMIDs for testing
const KNOWN_PMID = "20536893" // a classic paper with abstract

describe("fetch command", () => {
  test("returns text abstract for a known PMID", async () => {
    const result = await runCLI(["fetch", "--ids", KNOWN_PMID])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
    // Abstract text should contain the PMID reference or basic text
    expect(result.stderr).toBe("")
  })

  test("returns text for multiple PMIDs", async () => {
    const result = await runCLI(["fetch", "--ids", "20536893,17671087"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.length).toBeGreaterThan(0)
  })

  test("--format medline returns MEDLINE format", async () => {
    const result = await runCLI(["fetch", "--ids", KNOWN_PMID, "--format", "medline"])
    expect(result.exitCode).toBe(0)
    // MEDLINE format starts with PMID field
    expect(result.stdout).toContain("PMID")
  })

  test("missing --ids exits with error", async () => {
    const result = await runCLI(["fetch"])
    expect(result.exitCode).not.toBe(0)
  })
})
