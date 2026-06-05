import { Outlet } from 'react-router'

import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'

export default function WebsiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
