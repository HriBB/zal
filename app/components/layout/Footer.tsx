import { useState } from 'react'
import { Link } from 'react-router'

import type { ArchiveUnitSummary, FooterLink, SocialLink } from '~/sanity/queries'

type Props = {
  footerLinks: FooterLink[]
  socialLinks: SocialLink[]
  externalArchiveLinks: FooterLink[]
  archiveUnits: ArchiveUnitSummary[]
}

export function Footer({ footerLinks, socialLinks, externalArchiveLinks, archiveUnits }: Props) {
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

      {/* Archive units accordion */}
      {archiveUnits.length > 0 && (
        <div className="container-page border-t border-stone-700 py-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Enote
          </p>
          <ul className="space-y-2">
            {archiveUnits.map((unit) => (
              <UnitAccordionItem key={unit._id} unit={unit} />
            ))}
          </ul>
        </div>
      )}

      <div className="container-page border-t border-stone-700 py-4">
        <p className="text-xs text-stone-500">© {year} Zgodovinski arhiv Ljubljana</p>
      </div>
    </footer>
  )
}

function UnitAccordionItem({ unit }: { unit: ArchiveUnitSummary }) {
  const [open, setOpen] = useState(false)
  const id = `unit-accordion-${unit.slug}`

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-medium text-stone-200 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-400"
      >
        <Link
          to={`/enote/${unit.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-[var(--color-zal-light)]"
        >
          {unit.name}
        </Link>
        <span aria-hidden="true" className="ml-2 select-none text-stone-500">
          {open ? '−' : '+'}
        </span>
      </button>

      <div id={id} hidden={!open} className="px-2 pb-3 pt-1">
        <p className="whitespace-pre-line text-xs text-stone-400">{unit.address}</p>
        {unit.phones.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {unit.phones.map((p) => (
              <li key={p._key} className="text-xs text-stone-400">
                {p.label ? `${p.label}: ` : ''}
                <a href={`tel:${p.number.replace(/\s/g, '')}`} className="hover:text-white">
                  {p.number}
                </a>
              </li>
            ))}
          </ul>
        )}
        {unit.emails.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {unit.emails.map((email) => (
              <li key={email} className="text-xs text-stone-400">
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            ))}
          </ul>
        )}
        {(unit.officeHours.length > 0 || unit.readingRoomHours.length > 0) && (
          <div className="mt-2 space-y-1">
            {unit.officeHours.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500">Uradne ure</p>
                {unit.officeHours.map((s) => (
                  <p key={s._key} className="text-xs text-stone-400">
                    {s.days}: {s.hours}
                  </p>
                ))}
              </div>
            )}
            {unit.readingRoomHours.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500">Čitalnica</p>
                {unit.readingRoomHours.map((s) => (
                  <p key={s._key} className="text-xs text-stone-400">
                    {s.days}: {s.hours}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
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
