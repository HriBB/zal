import { ZAL_NAME } from './meta'

type OrgUnit = { name: string; address: string; slug: string }

export function buildOrganizationJsonLd(
  units: OrgUnit[],
  origin: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ArchiveOrganization',
    name: ZAL_NAME,
    url: origin,
    location: units.map((u) => ({
      '@type': 'Place',
      name: u.name,
      address: u.address,
      url: `${origin}/enote/${u.slug}`,
    })),
  }
}

type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildNewsArticleJsonLd({
  title,
  url,
  datePublished,
  imageUrl,
}: {
  title: string
  url: string
  datePublished: string
  imageUrl?: string | null
}): Record<string, unknown> {
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    url,
    datePublished,
    publisher: {
      '@type': 'Organization',
      name: ZAL_NAME,
    },
  }
  if (imageUrl) article['image'] = imageUrl
  return article
}
