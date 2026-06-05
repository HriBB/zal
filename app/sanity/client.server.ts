import { client } from '~/sanity/client'

// Server-only: carries the read token. Never import from client-side code.
export const serverClient = client.withConfig({
  token: process.env.SANITY_READ_TOKEN,
})
