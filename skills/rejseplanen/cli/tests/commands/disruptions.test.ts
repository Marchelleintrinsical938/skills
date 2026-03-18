import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON, hasAccessId } from "../helpers"

interface DisruptionItem {
  id: string
  subject: string
  message: string
  priority: number
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  affectedStops: string[]
  affectedLines: string[]
}

interface DisruptionsResponse {
  type: string
  date: string
  disruptions: DisruptionItem[]
  count: number
}

const SKIP = !hasAccessId()

describe("disruptions command", () => {
  test("disruptions returns correct shape", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["disruptions", "--max", "3"])
    const data = parseJSON<DisruptionsResponse>(result)

    expect(data.type).toBe("rejseplanen_disruptions")
    expect(typeof data.date).toBe("string")
    expect(Array.isArray(data.disruptions)).toBe(true)
    expect(data.count).toBe(data.disruptions.length)
  })

  test("disruption items have all expected fields", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["disruptions", "--max", "3"])
    const data = parseJSON<DisruptionsResponse>(result)

    if (data.disruptions.length > 0) {
      const d = data.disruptions[0]
      expect(typeof d.id).toBe("string")
      expect(typeof d.subject).toBe("string")
      expect(typeof d.message).toBe("string")
      expect(typeof d.priority).toBe("number")
      expect(typeof d.startDate).toBe("string")
      expect(typeof d.startTime).toBe("string")
      expect(typeof d.endDate).toBe("string")
      expect(typeof d.endTime).toBe("string")
      expect(Array.isArray(d.affectedStops)).toBe(true)
      expect(Array.isArray(d.affectedLines)).toBe(true)
    }
  })

  test("--format table outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["disruptions", "--max", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
  })

  test("--format plain outputs without error", async () => {
    if (SKIP) {
      console.log("Skipping: REJSEPLANEN_ACCESS_ID not set")
      return
    }
    const result = await runCLI(["disruptions", "--max", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
  })
})
