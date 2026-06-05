type ImageUrlOptions = {
  w?: number
  h?: number
  auto?: 'format'
  q?: number
  fit?: 'crop' | 'fill' | 'fillmax' | 'max' | 'min' | 'scale'
}

export function sanityImageUrl(
  url: string | null | undefined,
  opts: ImageUrlOptions = {},
): string | null {
  if (!url) return null
  const u = new URL(url)
  if (opts.w != null) u.searchParams.set('w', String(opts.w))
  if (opts.h != null) u.searchParams.set('h', String(opts.h))
  if (opts.auto) u.searchParams.set('auto', opts.auto)
  if (opts.q != null) u.searchParams.set('q', String(opts.q))
  if (opts.fit) u.searchParams.set('fit', opts.fit)
  return u.toString()
}
