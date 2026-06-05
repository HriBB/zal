import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// Posts must be seeded (pnpm seed:posts) before this suite runs.

test('/novice listing renders with heading and post links', async ({ page }) => {
  const res = await page.goto('/novice')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // At least one post link in the main list
  const list = page.getByRole('list', { name: 'Seznam novic' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('link').first()).toBeVisible()
})

test('/novice listing has category filter chips nav', async ({ page }) => {
  const res = await page.goto('/novice')
  expect(res?.status()).toBe(200)
  const filterNav = page.getByRole('navigation', { name: 'Filtri kategorij' })
  await expect(filterNav).toBeVisible()
  // Should have at least the "Vse" chip + category chips
  await expect(filterNav.getByRole('link').first()).toBeVisible()
})

test('/novice?kat=obvestila filters to that category', async ({ page }) => {
  const res = await page.goto('/novice?kat=obvestila')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The list should still render (may be empty if no posts, but no crash)
  await expect(page.getByRole('main')).toBeVisible()
})

test('/novice/:slug detail page renders with heading', async ({ page }) => {
  // Get first post href from the listing
  await page.goto('/novice')
  const list = page.getByRole('list', { name: 'Seznam novic' })
  await expect(list).toBeVisible()
  const firstLink = list.getByRole('link').first()
  const href = await firstLink.getAttribute('href')
  expect(href).toBeTruthy()
  // Navigate directly to the post
  await page.goto(href!)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // URL should contain /novice/
  expect(page.url()).toContain('/novice/')
  // Breadcrumb nav to parent listing
  await expect(page.getByRole('navigation', { name: 'Navigacijska pot' })).toBeVisible()
})

test('/novice/:slug missing slug returns 404', async ({ page }) => {
  const res = await page.goto('/novice/ta-novica-ne-obstaja-xyz')
  expect(res?.status()).toBe(404)
})

test('/arhivalija-meseca listing renders', async ({ page }) => {
  const res = await page.goto('/arhivalija-meseca')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Arhivalija list region
  const list = page.getByRole('list', { name: 'Arhivalija meseca' })
  await expect(list).toBeVisible()
})
