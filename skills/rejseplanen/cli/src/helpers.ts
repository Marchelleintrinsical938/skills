export const BASE_URL = "https://www.rejseplanen.dk/api"

function getAccessId(): string {
  const id = process.env.REJSEPLANEN_ACCESS_ID
  if (!id) {
    throw new Error("REJSEPLANEN_ACCESS_ID environment variable is not set. Get an access ID from Rejseplanen: https://help.rejseplanen.dk/hc/da/articles/214174465-Adgang-til-Rejseplanens-API")
  }
  return id
}

export async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const accessId = getAccessId()
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set("accessId", accessId)
  url.searchParams.set("format", "json")
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url.toString())
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((resolve) => setTimeout(resolve, delay + jitter))
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return response.json() as Promise<T>
  }
  throw new Error("API request failed after max retries")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/** Get today's date as YYYY-MM-DD */
export function todayDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Get current time as HH:MM */
export function nowTime(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, "0")
  const m = String(now.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

/** Calculate delay between scheduled and real-time */
export function calcDelay(
  scheduledTime: string,
  scheduledDate: string,
  rtTime?: string | null,
  rtDate?: string | null,
): { delayed: boolean; delayMinutes: number } {
  if (!rtTime) return { delayed: false, delayMinutes: 0 }

  const [sh, sm] = scheduledTime.split(":").map(Number)
  const [rh, rm] = rtTime.split(":").map(Number)

  let scheduledMin = sh * 60 + sm
  let rtMin = rh * 60 + rm

  // Handle day boundary
  if (rtDate && rtDate !== scheduledDate) {
    rtMin += 24 * 60
  } else if (rtMin < scheduledMin - 720) {
    // Next day wrap (e.g., scheduled 23:50, rt 00:02)
    rtMin += 24 * 60
  }

  const diff = rtMin - scheduledMin
  return { delayed: diff > 0, delayMinutes: Math.max(0, diff) }
}

export interface ParsedNote {
  type: "bike" | "accessibility" | "info"
  text: string
}

interface RawNote {
  value?: string
  key?: string
  type?: string
  routeIdxFrom?: number
  routeIdxTo?: number
}

/** Parse Notes array from API into typed notes */
export function parseNotes(notes?: RawNote[] | RawNote | null): ParsedNote[] {
  if (!notes) return []
  const arr = Array.isArray(notes) ? notes : [notes]
  const result: ParsedNote[] = []
  for (const note of arr) {
    if (!note.value) continue
    // Filter out internal/technical notes
    if (note.type === "I") continue
    let type: ParsedNote["type"] = "info"
    if (note.key === "FR") type = "bike"
    else if (note.key === "BE") type = "accessibility"
    result.push({ type, text: note.value })
  }
  return result
}
