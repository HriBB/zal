import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import type { Route } from './+types/root'

import './styles/app.css'

export function loader() {
  return {
    ENV: {
      VITE_SANITY_PROJECT_ID: process.env.VITE_SANITY_PROJECT_ID ?? '',
      VITE_SANITY_DATASET: process.env.VITE_SANITY_DATASET ?? '',
      VITE_SANITY_API_VERSION: process.env.VITE_SANITY_API_VERSION ?? '2024-10-01',
    },
  }
}

export const meta: Route.MetaFunction = () => [
  { title: 'Zgodovinski arhiv Ljubljana' },
  {
    name: 'description',
    content:
      'Zgodovinski arhiv Ljubljana — javni zavod s petimi območnimi enotami.',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-dvh">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Napaka'
  let details = 'Prišlo je do nepričakovane napake.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Napaka'
    details =
      error.status === 404
        ? 'Strani ni mogoče najti.'
        : error.statusText || details
  } else if (error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container-page py-24">
      <h1 className="text-4xl font-bold">{message}</h1>
      <p className="text-muted-foreground mt-4">{details}</p>
      {stack && (
        <pre className="bg-muted mt-6 w-full overflow-x-auto rounded-lg p-4 text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
