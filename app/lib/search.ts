// Pure search helpers — no Sanity client dependency.

export type SearchPageResult = {
  _id: string
  title: string
  slug: string
  parentSlug: string | null
}

export type SearchPostResult = {
  _id: string
  title: string
  slug: string
  date: string
}

export type SearchCollectionResult = {
  _id: string
  name: string
  slug: string
}

export type SearchArchiveItemResult = {
  _id: string
  title: string
  slug: string
  collectionSlug: string
}

export type SearchResults = {
  pages: SearchPageResult[]
  posts: SearchPostResult[]
  collections: SearchCollectionResult[]
  archiveItems: SearchArchiveItemResult[]
}

/** Trim and collapse internal whitespace. */
export function sanitizeTerm(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Valid when at least 2 characters. */
export function isValidTerm(term: string): boolean {
  return term.length >= 2
}

/** Return GROQ match params: sanitized term with prefix wildcard. */
export function buildSearchParams(raw: string): { term: string } {
  return { term: sanitizeTerm(raw) + '*' }
}

/** Sum of all result group lengths. */
export function totalHits(results: SearchResults): number {
  return (
    results.pages.length +
    results.posts.length +
    results.collections.length +
    results.archiveItems.length
  )
}

export type SearchRunner = (params: { term: string }) => Promise<SearchResults>

/** Run a search via an injectable runner (testable seam). */
export async function runSearch(raw: string, runner: SearchRunner): Promise<SearchResults> {
  return runner(buildSearchParams(raw))
}
