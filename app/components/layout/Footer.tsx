// Placeholder chrome. Footer navigation, unit hours and social links are
// CMS-driven and arrive with later slices; here we only establish the
// <footer> (role="contentinfo") landmark on the coal surface.
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-coal text-stone-300">
      <div className="container-page flex flex-col gap-2 py-12">
        <p className="font-semibold text-white">Zgodovinski arhiv Ljubljana</p>
        <p className="text-sm">Mestni trg 27, 1000 Ljubljana</p>
        <p className="mt-4 text-xs text-stone-400">
          © {year} Zgodovinski arhiv Ljubljana
        </p>
      </div>
    </footer>
  )
}
