export type PageAncestor = {
  slug: string
  parent?: PageAncestor | null
}

export function buildPagePreviewUrl(slug: string, ancestor?: PageAncestor | null): string {
  const parts: string[] = []
  let cur: PageAncestor | null | undefined = ancestor
  while (cur) {
    parts.unshift(cur.slug)
    cur = cur.parent
  }
  parts.push(slug)
  return '/' + parts.join('/')
}

export function buildPostPreviewUrl(slug: string): string {
  return `/novice/${slug}`
}

export function buildArchiveItemPreviewUrl(collection: string, slug: string): string {
  return `/digiteka/${collection}/${slug}`
}

export function buildCollectionPreviewUrl(slug: string): string {
  return `/digiteka/${slug}`
}
