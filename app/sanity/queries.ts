import { defineSanityQuery } from '~/sanity/data'

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
        rows[]{
          _key,
          isHeader,
          cells[]{_key, text}
        }
      },
      _type == "embedBlock" => {
        url
      },
      _type == "galleryBlock" => {
        figures[]{
          _key,
          alt,
          caption,
          asset->{_id, url, metadata{lqip, dimensions}}
        }
      }
    }
  }`,
)
