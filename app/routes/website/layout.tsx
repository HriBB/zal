import { Outlet } from 'react-router'
import { VisualEditing } from '@sanity/visual-editing/react-router'

import type { Route } from './+types/layout'

import { ExitPreview } from '~/components/ExitPreview'
import { SanityLiveMode } from '~/components/SanityLiveMode'
import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { useSanity } from '~/sanity/data'
import { loadSanity } from '~/sanity/data.server'
import { archiveUnitsQuery, siteSettingsQuery } from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  const [siteSettings, archiveUnits] = await Promise.all([
    loadSanity(request, siteSettingsQuery, { withPreview: true }),
    loadSanity(request, archiveUnitsQuery),
  ])
  return { siteSettings, archiveUnits }
}

export default function WebsiteLayout({ loaderData }: Route.ComponentProps) {
  const settings = useSanity(siteSettingsQuery, loaderData.siteSettings)
  const units = useSanity(archiveUnitsQuery, loaderData.archiveUnits) ?? []
  const { preview } = loaderData.siteSettings

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="fixed left-4 top-0 z-50 -translate-y-full rounded-b bg-white px-4 py-2 font-semibold text-[var(--zal)] shadow-lg transition-transform focus-visible:translate-y-0"
      >
        Preskoči na vsebino
      </a>
      <Header nav={settings?.nav ?? []} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer
        footerLinks={settings?.footerLinks ?? []}
        socialLinks={settings?.socialLinks ?? []}
        externalArchiveLinks={settings?.externalArchiveLinks ?? []}
        archiveUnits={units}
      />
      {preview ? (
        <>
          <SanityLiveMode />
          <ExitPreview />
          <VisualEditing />
        </>
      ) : null}
    </div>
  )
}
