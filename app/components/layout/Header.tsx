import { useRef, useState } from 'react'
import { Link } from 'react-router'

import type { NavChild, NavItem } from '~/sanity/queries'

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
            {nav.map((item) =>
              item.children && item.children.length > 0 ? (
                <DropdownNavItem key={item._key} item={item} />
              ) : (
                <li key={item._key}>
                  <NavLink item={item} />
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function DropdownNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)

  const handleBlur = (e: React.FocusEvent) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  return (
    <li
      ref={ref}
      data-dropdown=""
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
    >
      <NavLink item={item} />
      {open && (
        <ul className="bg-background border-border absolute left-0 top-full z-50 flex min-w-48 flex-col gap-1 rounded-md border p-2 shadow-md">
          {(item.children ?? []).map((child) => (
            <li key={child._key}>
              <NavLink item={child} className="block px-3 py-1.5 text-sm" />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function NavLink({
  item,
  className = 'text-muted-foreground hover:text-foreground text-sm',
}: {
  item: NavChild
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
