import { Link } from 'react-router'

import type { NavItem } from '~/sanity/queries'

type Props = { nav: NavItem[] }

export function Header({ nav }: Props) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          to="/"
          className="text-ink flex items-center gap-2 font-semibold"
          aria-label="Zgodovinski arhiv Ljubljana"
        >
          <span
            aria-hidden
            className="bg-zal inline-flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white"
          >
            ZAL
          </span>
          <span className="hidden sm:inline">Zgodovinski arhiv Ljubljana</span>
        </Link>
        <nav aria-label="Glavna navigacija">
          <ul className="flex items-center gap-6">
            {nav.map((item) => (
              <li key={item._key} className="relative group">
                <NavLink item={item} />
                {item.children && item.children.length > 0 && (
                  <ul className="bg-background border-border absolute left-0 top-full z-50 hidden min-w-48 flex-col gap-1 rounded-md border p-2 shadow-md group-hover:flex">
                    {item.children.map((child) => (
                      <li key={child._key}>
                        <NavLink item={child} className="block px-3 py-1.5 text-sm" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function NavLink({
  item,
  className = 'text-muted-foreground hover:text-foreground text-sm',
}: {
  item: { label: string; linkType?: string; href?: string; url?: string }
  className?: string
}) {
  if (item.linkType === 'external' && item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    )
  }
  return (
    <Link to={item.href ?? '/'} className={className}>
      {item.label}
    </Link>
  )
}
