export const BASE_URL = "https://api.sallinggroup.com"

function getApiKey(): string {
  const key = process.env.SALLING_API_KEY
  if (!key) {
    throw new Error("SALLING_API_KEY environment variable is not set. Get a free API key at https://developer.sallinggroup.com")
  }
  return key
}

export interface StoreAddress {
  street: string
  zip: string
  city: string
  country: string
}

export interface StoreInfo {
  id: string
  name: string
  brand: string
  address: StoreAddress
}

export interface ClearanceOffer {
  currency: string
  discount: number
  newPrice: number
  originalPrice: number
  percentDiscount: number
  stock: number
  stockUnit: string
}

export interface ClearanceProduct {
  description: string
  categories: { da: string; en: string }
  image: string | null
}

export interface Clearance {
  offer: ClearanceOffer
  product: ClearanceProduct
}

export interface StoreWithClearances {
  store: StoreInfo
  clearances: Clearance[]
}

export interface FormattedStore {
  id: string
  name: string
  brand: string
  address: string
  itemCount: number
}

export interface FormattedProduct {
  name: string
  category: string
  newPrice: number
  originalPrice: number
  discount: number
  percentDiscount: number
  stock: number
  stockUnit: string
  image: string | null
}

export function formatStore(item: StoreWithClearances): FormattedStore {
  const a = item.store.address
  const address = [a.street, a.zip, a.city].filter(Boolean).join(", ")
  return {
    id: item.store.id,
    name: item.store.name,
    brand: item.store.brand,
    address,
    itemCount: item.clearances.length,
  }
}

export function formatProduct(c: Clearance): FormattedProduct {
  return {
    name: c.product.description ?? "",
    category: c.product.categories?.da ?? c.product.categories?.en ?? "",
    newPrice: c.offer.newPrice,
    originalPrice: c.offer.originalPrice,
    discount: c.offer.discount,
    percentDiscount: c.offer.percentDiscount,
    stock: c.offer.stock,
    stockUnit: c.offer.stockUnit,
    image: c.product.image ?? null,
  }
}

export async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = getApiKey()
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      // Add jitter to spread out retries: base delay + random 0-500ms
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
