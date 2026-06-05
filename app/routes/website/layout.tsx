import { Outlet } from 'react-router'

import type { Route } from './+types/layout'

import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { loadSanity } from '~/sanity/data.server'
import { siteSettingsQuery } from '~/sanity/queries'

export async function loader({ request }: Route.LoaderArgs) {
  const siteSettings = await loadSanity(request, siteSettingsQuery)
  return { siteSettings }
}

export default function WebsiteLayout({ loaderData }: Route.ComponentProps) {
  const settings = loaderData.siteSettings.initial.data
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
      />
    </div>
  )
}
