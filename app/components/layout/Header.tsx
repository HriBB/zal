import { Link } from 'react-router'

// Placeholder chrome. The real navigation is CMS-driven (siteSettings) and
// arrives with the Sanity wiring slice; here we only establish the <header>
// (role="banner") landmark and the home link.
export function Header() {
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
        <nav aria-label="Glavna navigacija" className="flex items-center gap-6">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Domov
          </Link>
        </nav>
      </div>
    </header>
  )
}
