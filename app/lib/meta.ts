import type { MetaDescriptor } from 'react-router'

export const ZAL_NAME = 'Zgodovinski arhiv Ljubljana'
export const ZAL_ORIGIN = 'https://www.zal-lj.si'
export const ZAL_OG_IMAGE = `${ZAL_ORIGIN}/og-default.png`

export function buildMeta({
  title,
  description,
  pathname,
  ogImageUrl,
  ogType = 'website',
  noSuffix = false,
}: {
  title: string
  description: string
  pathname: string
  ogImageUrl?: string | null
  ogType?: 'website' | 'article'
  noSuffix?: boolean
}): MetaDescriptor[] {
  const docTitle = noSuffix ? title : `${title} — ZAL`
  const canonical = `${ZAL_ORIGIN}${pathname}`
  const ogImage = ogImageUrl ?? ZAL_OG_IMAGE

  return [
    { title: docTitle },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: ogType },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:site_name', content: ZAL_NAME },
    { tagName: 'link', rel: 'canonical', href: canonical },
  ]
}
