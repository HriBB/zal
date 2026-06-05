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
