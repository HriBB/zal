import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// These pages must be re-seeded before this suite runs so embed blocks are present.

test('kako-do-nas page exposes map embeds', async ({ page }) => {
  const res = await page.goto('/o-arhivu/kako-do-nas')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // At least one iframe from Google Maps
  const mapIframe = page.locator('iframe[src*="google.com/maps"]').first()
  await expect(mapIframe).toBeVisible()
})

test('filmoteka-zal page exposes video embeds', async ({ page }) => {
  const res = await page.goto('/filmoteka-zal')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // At least one YouTube nocookie iframe
  const videoIframe = page.locator('iframe[src*="youtube"]').first()
  await expect(videoIframe).toBeVisible()
})

test('prijava-za-seminar page exposes a form embed', async ({ page }) => {
  const res = await page.goto('/prijava-za-seminar')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('main')).toBeVisible()
  // Google Forms iframe
  const formIframe = page.locator('iframe[src*="docs.google.com/forms"]').first()
  await expect(formIframe).toBeVisible()
})
