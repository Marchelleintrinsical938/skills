export const BASE_URL = "https://api.boligsiden.dk"

export function formatPrice(price: number): string {
  return price.toLocaleString("da-DK")
}

/**
 * Build a human-readable address string.
 * Handles two shapes:
 *   - Flat (sold API): roadName, houseNumber, zip, city at top level
 *   - Nested (search/rentals API): address.roadName, address.houseNumber, etc.
 */
export function getAddressStr(item: any): string {
  // Nested shape: item has an `address` sub-object
  const addr = item.address as Record<string, unknown> | undefined
  if (addr) {
    const road = addr.roadName ?? addr.road ?? ""
    const num = addr.houseNumber ?? ""
    const floor = addr.floor ? `, ${addr.floor}.` : ""
    const door = addr.door ? ` ${addr.door}` : ""
    const zip = (addr.zip as Record<string, unknown>)?.zipCode ?? addr.zipCode ?? ""
    const city = (addr.city as Record<string, unknown>)?.name ?? addr.cityName ?? ""
    return `${road} ${num}${floor}${door}, ${zip} ${city}`.trim()
  }
  // Flat shape: roadName etc. at top level (sold API)
  const road = item.roadName ?? (item.road as Record<string, unknown>)?.name ?? ""
  const num = item.houseNumber ?? ""
  const zip = (item.zip as Record<string, unknown>)?.zipCode ?? item.zipCode ?? ""
  const city = (item.city as Record<string, unknown>)?.name ?? item.cityName ?? ""
  return `${road} ${num}, ${zip} ${city}`.trim()
}

export async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  let url = `${BASE_URL}${path}`
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params)
    url += `?${qs.toString()}`
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}
