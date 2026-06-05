import { Link } from 'react-router'

import type { BreadcrumbItem } from '~/sanity/queries'

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  current: string
}

export function Breadcrumbs({ items, current }: BreadcrumbsProps) {
  // Build cumulative paths: items[0] = topmost ancestor, last = direct parent
  const paths = items.map((_, i) =>
    '/' + items.slice(0, i + 1).map((b) => b.slug).join('/'),
  )

  return (
    <nav aria-label="Navigacijska pot" className="text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:text-[var(--color-zal)]">
            Domov
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.slug} className="flex items-center gap-1">
            <span aria-hidden>›</span>
            <Link to={paths[i]!} className="hover:text-[var(--color-zal)]">
              {item.title}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span aria-hidden>›</span>
          <span className="text-stone-800" aria-current="page">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  )
}
