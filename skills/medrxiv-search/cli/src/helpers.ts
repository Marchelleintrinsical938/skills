export const BASE_URL = "https://api.medrxiv.org/details/medrxiv"

export const CATEGORIES = [
  "addiction medicine",
  "allergy and immunology",
  "anesthesia",
  "cardiovascular medicine",
  "dentistry and oral medicine",
  "dermatology",
  "emergency medicine",
  "endocrinology",
  "epidemiology",
  "forensic medicine",
  "gastroenterology",
  "genetic and genomic medicine",
  "geriatric medicine",
  "health economics",
  "health informatics",
  "health policy",
  "health systems and quality improvement",
  "hematology",
  "hiv/aids",
  "infectious diseases",
  "intensive care and critical care medicine",
  "medical education",
  "medical ethics",
  "nephrology",
  "neurology",
  "nursing",
  "nutrition",
  "obstetrics and gynecology",
  "occupational and environmental health",
  "oncology",
  "ophthalmology",
  "orthopedics",
  "otolaryngology",
  "pain medicine",
  "palliative medicine",
  "pathology",
  "pediatrics",
  "pharmacology and therapeutics",
  "primary care research",
  "psychiatry and clinical psychology",
  "public and global health",
  "radiology and imaging",
  "rehabilitation medicine and physical therapy",
  "respiratory medicine",
  "rheumatology",
  "sexual and reproductive health",
  "sports medicine",
  "surgery",
  "toxicology",
  "transplantation",
  "urology",
] as const

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export interface ApiPaper {
  doi: string
  title: string
  authors: string
  author_corresponding: string
  author_corresponding_institution: string
  date: string
  version: string
  category: string
  abstract: string
  published: string
}

export interface FormattedPaper {
  doi: string
  title: string
  authors: string
  author_corresponding: string
  institution: string
  date: string
  version: string
  category: string
  abstract: string
  published: string
  url: string
}

export function formatPaper(paper: ApiPaper): FormattedPaper {
  return {
    doi: paper.doi,
    title: paper.title,
    authors: paper.authors,
    author_corresponding: paper.author_corresponding,
    institution: paper.author_corresponding_institution,
    date: paper.date,
    version: paper.version,
    category: paper.category,
    abstract: paper.abstract,
    published: paper.published,
    url: `https://www.medrxiv.org/content/${paper.doi}v${paper.version}`,
  }
}

interface ApiPageResponse {
  messages?: Array<{ status: string; total?: number }>
  collection?: ApiPaper[]
}

export async function apiFetch<T>(url: string): Promise<T> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url)
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

const PAGE_SIZE = 100

export async function fetchAllPapers(dateFrom: string, dateTo: string): Promise<ApiPaper[]> {
  const papers: ApiPaper[] = []
  let cursor = 0
  let total = Infinity

  while (cursor < total) {
    const url = `${BASE_URL}/${dateFrom}/${dateTo}/${cursor}/json`
    const data = await apiFetch<ApiPageResponse>(url)
    const msg = data.messages?.[0]
    if (msg && msg.total !== undefined) total = msg.total
    if (data.collection) papers.push(...data.collection)
    cursor += PAGE_SIZE
    if (!data.collection || data.collection.length === 0) break
  }

  return papers
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}
