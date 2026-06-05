export function normalizeOldPath(urlOrPath: string): string {
  let pathname: string
  try {
    pathname = new URL(urlOrPath).pathname
  } catch {
    pathname = urlOrPath
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function buildPagePath(slugChain: (string | null | undefined)[]): string {
  return '/' + slugChain.filter(Boolean).join('/')
}
