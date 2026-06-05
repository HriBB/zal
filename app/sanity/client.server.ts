import { client } from '~/sanity/client'

// Server-only: carries the read token and bypasses CDN for fresh data.
// Never import from client-side code.
export const serverClient = client.withConfig({
  token: process.env.SANITY_READ_TOKEN,
  useCdn: false,
})
