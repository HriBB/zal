export type PageChainInfo = {
  slug: string
  parentSlug: string | null
  grandParentSlug: string | null
  greatGrandParentSlug: string | null
}

/**
 * Returns true when the page's full ancestor chain matches the URL segments
 * exactly (root-to-leaf order). A segment count mismatch or any slug mismatch
 * returns false (ADR-0004: wrong-chain URLs are 404s).
 */
export function matchesChain(page: PageChainInfo, segments: string[]): boolean {
  const chain = [
    page.greatGrandParentSlug,
    page.grandParentSlug,
    page.parentSlug,
    page.slug,
  ].filter((s): s is string => s !== null)

  if (chain.length !== segments.length) return false
  return chain.every((slug, i) => slug === segments[i])
}
