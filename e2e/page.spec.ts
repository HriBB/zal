import { expect, test } from '@playwright/test'

// Structural assertions against the production build.
// Never assert CMS copy — only shape and status.

test('2-level page renders with breadcrumb nav', async ({ page }) => {
  // /o-arhivu/kontakti is a known 2-level page seeded from WP
  const res = await page.goto('/o-arhivu/kontakti')
  expect(res?.status()).toBe(200)

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // breadcrumb nav must exist
  await expect(page.getByRole('navigation', { name: 'Navigacijska pot' })).toBeVisible()
  // must include a link to the parent section
  await expect(
    page.getByRole('navigation', { name: 'Navigacijska pot' }).getByRole('link'),
  ).not.toHaveCount(0)
})

test('3-level page renders with breadcrumb nav', async ({ page }) => {
  // /o-arhivu/predstavitev/enota-v-ljubljani is a known 3-level page
  const res = await page.goto('/o-arhivu/predstavitev/enota-v-ljubljani')
  expect(res?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigacijska pot' })).toBeVisible()
  // 3-level: breadcrumb has 2 ancestor links + current (aria-current=page)
  const nav = page.getByRole('navigation', { name: 'Navigacijska pot' })
  const links = nav.getByRole('link')
  await expect(links).not.toHaveCount(0)
})

test('unknown URL returns 404 status', async ({ page }) => {
  const res = await page.goto('/does-not-exist-anywhere')
  expect(res?.status()).toBe(404)
})

test('wrong-chain URL returns 404 (ADR-0004)', async ({ page }) => {
  // kontakti lives under /o-arhivu, not /za-uporabnike
  const res = await page.goto('/za-uporabnike/kontakti')
  expect(res?.status()).toBe(404)
})

test('katalog page renders at least one table element', async ({ page }) => {
  // katalog-informacij-javnega-znacaja has 4 real tables after Divi footer cut
  const res = await page.goto('/o-arhivu/katalog-informacij-javnega-znacaja')
  expect(res?.status()).toBe(200)
  await expect(page.locator('table').first()).toBeVisible()
})
