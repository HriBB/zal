import { Outlet } from 'react-router'

import type { Route } from './+types/layout'

import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { loadSanity } from '~/sanity/data.server'
import { archiveUnitsQuery, siteSettingsQuery } from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  const [siteSettings, archiveUnits] = await Promise.all([
    loadSanity(request, siteSettingsQuery),
    loadSanity(request, archiveUnitsQuery),
  ])
  return { siteSettings, archiveUnits }
}

export default function WebsiteLayout({ loaderData }: Route.ComponentProps) {
  const settings = loaderData.siteSettings.initial.data
  const units = loaderData.archiveUnits.initial.data ?? []
  return (
    <div className="flex min-h-dvh flex-col">
      <Header nav={settings?.nav ?? []} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer
        footerLinks={settings?.footerLinks ?? []}
        socialLinks={settings?.socialLinks ?? []}
        externalArchiveLinks={settings?.externalArchiveLinks ?? []}
        archiveUnits={units}
      />
    </div>
  )
}
