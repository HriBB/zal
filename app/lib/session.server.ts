import { createCookieSessionStorage } from 'react-router'

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: '__preview',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SANITY_SESSION_SECRET ?? 'zal-preview-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
})

export { commitSession, destroySession, getSession }
