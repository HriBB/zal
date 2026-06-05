import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// Archive units must be seeded (pnpm seed:units) before this suite runs.

test('/enote/ljubljana renders unit page with heading and contacts', async ({ page }) => {
  const res = await page.goto('/enote/ljubljana')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Contacts section present
  await expect(page.getByRole('region', { name: 'Kontakti' })).toBeVisible()
  // Hours section present
  await expect(page.getByRole('region', { name: 'Delovni čas' })).toBeVisible()
  // Map iframe present
  await expect(page.locator('iframe[title]')).toBeVisible()
})

test('/enote/ljubljana has breadcrumb back to /enote', async ({ page }) => {
  await page.goto('/enote/ljubljana')
  const breadcrumb = page.getByRole('navigation', { name: 'Navigacijska pot' })
  await expect(breadcrumb).toBeVisible()
  await expect(breadcrumb.getByRole('link', { name: 'Enote' })).toBeVisible()
})

test('/enote/ta-enota-ne-obstaja returns 404', async ({ page }) => {
  const res = await page.goto('/enote/ta-enota-ne-obstaja-xyz')
  expect(res?.status()).toBe(404)
})

test('footer accordion has archive unit items', async ({ page }) => {
  await page.goto('/')
  const footer = page.getByRole('contentinfo')
  await expect(footer).toBeVisible()
  // Unit button should be present
  const firstUnitBtn = footer.locator('button[aria-expanded]').first()
  await expect(firstUnitBtn).toBeVisible()
})

test('footer accordion expands on click', async ({ page }) => {
  await page.goto('/')
  const footer = page.getByRole('contentinfo')
  const firstUnitBtn = footer.locator('button[aria-expanded]').first()
  // Initially collapsed
  await expect(firstUnitBtn).toHaveAttribute('aria-expanded', 'false')
  await firstUnitBtn.click()
  await expect(firstUnitBtn).toHaveAttribute('aria-expanded', 'true')
  // Expanded panel visible
  const controlsId = await firstUnitBtn.getAttribute('aria-controls')
  const panel = footer.locator(`#${controlsId}`)
  await expect(panel).toBeVisible()
})
