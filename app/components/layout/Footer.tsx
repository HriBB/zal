import { Link } from 'react-router'

import type { FooterLink, SocialLink } from '~/sanity/queries'

type Props = {
  footerLinks: FooterLink[]
  socialLinks: SocialLink[]
  externalArchiveLinks: FooterLink[]
}

export function Footer({ footerLinks, socialLinks, externalArchiveLinks }: Props) {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-coal text-stone-300">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        {/* Identity */}
        <div>
          <p className="font-semibold text-white">Zgodovinski arhiv Ljubljana</p>
          <p className="mt-1 text-sm">Mestni trg 27, 1000 Ljubljana</p>
          {socialLinks.map((s) => (
            <a
              key={s._key}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-stone-400 hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* Useful links */}
        {footerLinks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Koristne povezave
            </p>
            <ul className="space-y-1">
              {footerLinks.map((l) => (
                <li key={l._key}>
                  <FooterNavLink link={l} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* External archives */}
        {externalArchiveLinks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Zunanji arhivi
            </p>
            <ul className="space-y-1">
              {externalArchiveLinks.map((l) => (
                <li key={l._key}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stone-300 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="container-page border-t border-stone-700 py-4">
        <p className="text-xs text-stone-500">© {year} Zgodovinski arhiv Ljubljana</p>
      </div>
    </footer>
  )
}

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.linkType === 'external' && link.url) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-stone-300 hover:text-white"
      >
        {link.label}
      </a>
    )
  }
  return (
    <Link to={link.href ?? '/'} className="text-sm text-stone-300 hover:text-white">
      {link.label}
    </Link>
  )
}
