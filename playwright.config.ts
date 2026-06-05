import { defineConfig, devices } from '@playwright/test'

// E2E targets the production build (react-router-serve), not the dev server:
// the invariants we assert — SSR HTML, header/footer landmarks, status codes —
// are server behaviors that can differ under dev's HMR/error overlay.
// Assertions are structure-only (landmarks, routes), never CMS copy.
const PORT = 3000
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
