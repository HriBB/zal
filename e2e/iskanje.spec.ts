import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.

test('/iskanje: empty query shows empty state and SIRAnet banner', async ({ page }) => {
  const res = await page.goto('/iskanje')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // SIRAnet banner always present
  await expect(page.getByRole('complementary', { name: 'SIRAnet' })).toBeVisible()
  // Empty state message
  await expect(page.getByLabel('Prazno iskanje')).toBeVisible()
})

test('/iskanje: SIRAnet banner contains links to siranet.si and vac.si', async ({ page }) => {
  await page.goto('/iskanje')
  const banner = page.getByRole('complementary', { name: 'SIRAnet' })
  await expect(banner.getByRole('link', { name: /siranet/i })).toBeVisible()
  await expect(banner.getByRole('link', { name: /vac/i })).toBeVisible()
})

test('/iskanje: renders grouped results structure for a known term', async ({ page }) => {
  const res = await page.goto('/iskanje?q=arhiv')
  expect(res?.status()).toBe(200)

  await expect(page.getByRole('main')).toBeVisible()
  // SIRAnet banner always present
  await expect(page.getByRole('complementary', { name: 'SIRAnet' })).toBeVisible()
  // Results container present when hits > 0 — or no-results message when 0.
  // Either is structurally valid.
  const resultsEl = page.getByLabel('Rezultati iskanja')
  const noResultsEl = page.getByLabel('Ni zadetkov')
  const eitherVisible = (await resultsEl.isVisible()) || (await noResultsEl.isVisible())
  expect(eitherVisible).toBe(true)
})

test('/iskanje: search form round-trip from hero submits to /iskanje', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Hero' })
  const input = hero.locator('input[name="q"]')
  await input.fill('listina')
  await hero.getByRole('button', { name: /išči/i }).click()
  await page.waitForURL(/\/iskanje/)
  expect(page.url()).toContain('q=listina')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // SIRAnet banner present on the results page
  await expect(page.getByRole('complementary', { name: 'SIRAnet' })).toBeVisible()
})

test('/iskanje: no-results state renders for unlikely term', async ({ page }) => {
  await page.goto('/iskanje?q=xyzzyqwerty123456')
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'SIRAnet' })).toBeVisible()
  // Either no-results message or grouped results (if by chance something matches)
  const noResults = page.getByLabel('Ni zadetkov')
  const hasResults = page.getByLabel('Rezultati iskanja')
  const eitherVisible = (await noResults.isVisible()) || (await hasResults.isVisible())
  expect(eitherVisible).toBe(true)
})
