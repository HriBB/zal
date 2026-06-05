import { defineSanityQuery } from '~/sanity/data'
import type {
  SearchResults,
} from '~/lib/search'

// ── Shared ────────────────────────────────────────────────────────────────────

const BLOCKS_PROJECTION = `
  blocks[]{
    _type,
    _key,
    _type == "richTextBlock" => {
      body[]{
        ...,
        _type == "figure" => {
          ...,
          asset->{_id, url, metadata{lqip, dimensions}}
        }
      }
    },
    _type == "tableBlock" => {
      rows[]{_key, isHeader, cells[]{_key, text}}
    },
    _type == "embedBlock" => { url },
    _type == "galleryBlock" => {
      figures[]{_key, alt, caption, asset->{_id, url, metadata{lqip, dimensions}}}
    }
  }
`

export type NavChild = {
  _key: string
  label: string
  linkType: 'internal' | 'external'
  href?: string
  url?: string
}

export type NavItem = NavChild & {
  children?: NavChild[]
}

export type FooterLink = {
  _key: string
  label: string
  linkType: 'internal' | 'external'
  href?: string
  url?: string
}

export type SocialLink = {
  _key: string
  label: string
  url: string
}

export type SiteSettings = {
  nav: NavItem[]
  footerLinks: FooterLink[]
  socialLinks: SocialLink[]
  externalArchiveLinks: FooterLink[]
}

export const siteSettingsQuery = defineSanityQuery<SiteSettings>(
  `*[_type == "siteSettings"][0]{
    nav[]{
      _key,
      label,
      linkType,
      href,
      url,
      children[]{
        _key,
        label,
        linkType,
        href,
        url,
      }
    },
    footerLinks[]{_key, label, linkType, href, url},
    socialLinks[]{_key, label, url},
    externalArchiveLinks[]{_key, label, url},
  }`,
)

// ── Page ─────────────────────────────────────────────────────────────────────

export type BreadcrumbItem = {
  title: string
  slug: string
}

export type PageData = {
  _id: string
  title: string
  slug: string
  parentSlug: string | null
  grandParentSlug: string | null
  greatGrandParentSlug: string | null
  breadcrumbs: BreadcrumbItem[]
  blocks: Array<Record<string, unknown>>
}

export const pageQuery = defineSanityQuery<PageData | null, { slug: string }>(
  `*[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current,
    "grandParentSlug": parent->parent->slug.current,
    "greatGrandParentSlug": parent->parent->parent->slug.current,
    "breadcrumbs": [
      parent->parent->parent->{title, "slug": slug.current},
      parent->parent->{title, "slug": slug.current},
      parent->{title, "slug": slug.current},
    ][defined(title)],
    ${BLOCKS_PROJECTION}
  }`,
)

// ── Post / Category ───────────────────────────────────────────────────────────

export type CategoryRef = {
  _id: string
  title: string
  slug: string
}

export type MainImageData = {
  alt: string
  asset: {
    _id: string
    url: string
    metadata: { lqip: string | null; dimensions: { width: number; height: number } | null }
  } | null
}

export type PostSummary = {
  _id: string
  title: string
  slug: string
  date: string
  categories: CategoryRef[]
  mainImage: MainImageData | null
}

export type PostData = PostSummary & {
  blocks: Array<Record<string, unknown>>
}

export type PostListData = {
  posts: PostSummary[]
  total: number
}

export const categoriesQuery = defineSanityQuery<CategoryRef[]>(
  `*[_type == "category"] | order(title asc){
    "_id": _id,
    title,
    "slug": slug.current
  }`,
)

const MAIN_IMAGE_PROJECTION = `mainImage{alt, asset->{_id, url, metadata{lqip, dimensions}}}`

export const postListQuery = defineSanityQuery<
  PostListData,
  { cat: string; offset: number; lastIndex: number }
>(
  `{
    "posts": *[_type == "post" && ($cat == "" || $cat in categories[]->slug.current)]
      | order(date desc)[$offset..$lastIndex]{
        _id,
        title,
        "slug": slug.current,
        date,
        "categories": categories[]->{_id, title, "slug": slug.current},
        ${MAIN_IMAGE_PROJECTION}
      },
    "total": count(*[_type == "post" && ($cat == "" || $cat in categories[]->slug.current)])
  }`,
)

export const postQuery = defineSanityQuery<PostData | null, { slug: string }>(
  `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    date,
    "categories": categories[]->{_id, title, "slug": slug.current},
    ${MAIN_IMAGE_PROJECTION},
    ${BLOCKS_PROJECTION}
  }`,
)

export const arhivaListQuery = defineSanityQuery<PostSummary[]>(
  `*[_type == "post" && "arhivalija-meseca" in categories[]->slug.current]
    | order(date desc){
      _id,
      title,
      "slug": slug.current,
      date,
      "categories": categories[]->{_id, title, "slug": slug.current},
      ${MAIN_IMAGE_PROJECTION}
    }`,
)

// ── Digiteka: collection + archiveItem ───────────────────────────────────────

export type CollectionSummary = {
  _id: string
  name: string
  slug: string
  itemCount: number
  description: string | null
  externalUrl: string | null
}

export type CollectionData = CollectionSummary

export type MetadataEntry = {
  _key: string
  label: string
  value: string
}

export type ArchiveItemSummary = {
  _id: string
  title: string
  slug: string
  collectionSlug: string
}

export type ArchiveItemData = {
  _id: string
  title: string
  slug: string
  collectionSlug: string
  collectionName: string
  metadata: MetadataEntry[]
  gallery: Array<{
    _key: string
    alt: string | null
    caption: string | null
    asset: {
      _id: string
      url: string
      metadata: { lqip: string | null; dimensions: { width: number; height: number } | null }
    } | null
  }>
  externalUrl: string | null
  _oldPath: string | null
}

export type ArchiveItemListData = {
  items: ArchiveItemSummary[]
  total: number
}

export const collectionsQuery = defineSanityQuery<CollectionSummary[]>(
  `*[_type == "collection"] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    "itemCount": count(*[_type == "archiveItem" && references(^._id)]),
    description,
    externalUrl
  }`,
)

export const collectionQuery = defineSanityQuery<CollectionData | null, { slug: string }>(
  `*[_type == "collection" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    "itemCount": count(*[_type == "archiveItem" && references(^._id)]),
    description,
    externalUrl
  }`,
)

export const archiveItemListQuery = defineSanityQuery<
  ArchiveItemListData,
  { collectionId: string; offset: number; lastIndex: number }
>(
  `{
    "items": *[_type == "archiveItem" && collection._ref == $collectionId]
      | order(title asc)[$offset..$lastIndex]{
        _id,
        title,
        "slug": slug.current,
        "collectionSlug": collection->slug.current
      },
    "total": count(*[_type == "archiveItem" && collection._ref == $collectionId])
  }`,
)

export const archiveItemQuery = defineSanityQuery<ArchiveItemData | null, { slug: string; collectionSlug: string }>(
  `*[_type == "archiveItem" && slug.current == $slug && collection->slug.current == $collectionSlug][0]{
    _id,
    title,
    "slug": slug.current,
    "collectionSlug": collection->slug.current,
    "collectionName": collection->name,
    metadata[]{_key, label, value},
    gallery[]{_key, alt, caption, asset->{_id, url, metadata{lqip, dimensions}}},
    externalUrl,
    _oldPath
  }`,
)

// ── Home page singleton ───────────────────────────────────────────────────────

export type ServiceCard = {
  _key: string
  title: string
  description: string | null
  href: string
  image: MainImageData | null
}

export type HomeHero = {
  heading: string
  lead: string | null
  image: MainImageData | null
}

export type HomePageData = {
  hero: HomeHero | null
  serviceCards: ServiceCard[]
}

export const homePageQuery = defineSanityQuery<HomePageData | null>(
  `*[_type == "homePage"][0]{
    hero{
      heading,
      lead,
      image{alt, asset->{_id, url, metadata{lqip, dimensions}}}
    },
    serviceCards[]{
      _key,
      title,
      description,
      href,
      image{alt, asset->{_id, url, metadata{lqip, dimensions}}}
    }
  }`,
)

export const homeLatestPostsQuery = defineSanityQuery<PostSummary[]>(
  `*[_type == "post"] | order(date desc)[0..5]{
    _id,
    title,
    "slug": slug.current,
    date,
    "categories": categories[]->{_id, title, "slug": slug.current},
    ${MAIN_IMAGE_PROJECTION}
  }`,
)

export const homeArhavalijaQuery = defineSanityQuery<PostSummary | null>(
  `*[_type == "post" && "arhivalija-meseca" in categories[]->slug.current]
    | order(date desc)[0]{
    _id,
    title,
    "slug": slug.current,
    date,
    "categories": categories[]->{_id, title, "slug": slug.current},
    ${MAIN_IMAGE_PROJECTION}
  }`,
)

// ── Archive unit ──────────────────────────────────────────────────────────────

export type HourSlot = {
  _key: string
  days: string
  hours: string
}

export type PhoneEntry = {
  _key: string
  label: string | null
  number: string
}

export type ArchiveUnitSummary = {
  _id: string
  name: string
  slug: string
  address: string
  phones: PhoneEntry[]
  emails: string[]
  officeHours: HourSlot[]
  readingRoomHours: HourSlot[]
  photo: MainImageData | null
}

export type ArchiveUnitData = ArchiveUnitSummary & {
  mapUrl: string | null
  photo: {
    alt: string | null
    asset: {
      _id: string
      url: string
      metadata: { lqip: string | null; dimensions: { width: number; height: number } | null }
    } | null
  } | null
  description: string | null
}

const UNIT_HOURS_PROJECTION = `
  officeHours[]{_key, days, hours},
  readingRoomHours[]{_key, days, hours}
`

export const archiveUnitsQuery = defineSanityQuery<ArchiveUnitSummary[]>(
  `*[_type == "archiveUnit"] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    address,
    phones[]{_key, label, number},
    emails,
    ${UNIT_HOURS_PROJECTION},
    photo{
      "alt": asset->altText,
      asset->{_id, url, metadata{lqip, dimensions}}
    }
  }`,
)

export const archiveUnitQuery = defineSanityQuery<ArchiveUnitData | null, { slug: string }>(
  `*[_type == "archiveUnit" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    address,
    phones[]{_key, label, number},
    emails,
    ${UNIT_HOURS_PROJECTION},
    mapUrl,
    photo{
      "alt": asset->altText,
      asset->{_id, url, metadata{lqip, dimensions}}
    },
    description
  }`,
)

// ── Sitemap ───────────────────────────────────────────────────────────────────

export type SitemapPage = {
  slug: string
  parentSlug: string | null
  grandParentSlug: string | null
  greatGrandParentSlug: string | null
  _updatedAt: string
}

export type SitemapPost = {
  slug: string
  _updatedAt: string
}

export type SitemapCollection = {
  slug: string
  _updatedAt: string
}

export type SitemapArchiveItem = {
  slug: string
  collectionSlug: string
  _updatedAt: string
}

export const sitemapPagesQuery = defineSanityQuery<SitemapPage[]>(
  `*[_type == "page"] | order(_updatedAt asc){
    "slug": slug.current,
    "parentSlug": parent->slug.current,
    "grandParentSlug": parent->parent->slug.current,
    "greatGrandParentSlug": parent->parent->parent->slug.current,
    _updatedAt
  }`,
)

export const sitemapPostsQuery = defineSanityQuery<SitemapPost[]>(
  `*[_type == "post"] | order(_updatedAt asc){
    "slug": slug.current,
    _updatedAt
  }`,
)

export const sitemapCollectionsQuery = defineSanityQuery<SitemapCollection[]>(
  `*[_type == "collection"] | order(_updatedAt asc){
    "slug": slug.current,
    _updatedAt
  }`,
)

export const sitemapArchiveItemsQuery = defineSanityQuery<SitemapArchiveItem[]>(
  `*[_type == "archiveItem"] | order(_updatedAt asc){
    "slug": slug.current,
    "collectionSlug": collection->slug.current,
    _updatedAt
  }`,
)

// ── RSS feed ──────────────────────────────────────────────────────────────────

export type RssFeedPost = {
  title: string
  slug: string
  date: string
}

export const rssFeedQuery = defineSanityQuery<RssFeedPost[]>(
  `*[_type == "post"] | order(date desc)[0..49]{
    title,
    "slug": slug.current,
    date
  }`,
)

// ── Search ────────────────────────────────────────────────────────────────────

// Re-export so routes only need to import from queries.
export type { SearchResults, SearchPageResult, SearchPostResult, SearchCollectionResult, SearchArchiveItemResult } from '~/lib/search'

export const searchQuery = defineSanityQuery<SearchResults, { term: string }>(
  `{
    "pages": *[_type == "page" && title match $term][0..9]{
      _id,
      title,
      "slug": slug.current,
      "parentSlug": parent->slug.current
    },
    "posts": *[_type == "post" && title match $term][0..9]{
      _id,
      title,
      "slug": slug.current,
      date
    },
    "collections": *[_type == "collection" && name match $term][0..9]{
      _id,
      name,
      "slug": slug.current
    },
    "archiveItems": *[_type == "archiveItem" && (
      title match $term ||
      count(metadata[value match $term]) > 0
    )][0..9]{
      _id,
      title,
      "slug": slug.current,
      "collectionSlug": collection->slug.current
    }
  }`,
)
