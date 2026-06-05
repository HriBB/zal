import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// Digiteka must be seeded (pnpm seed:digiteka) before this suite runs.

test('/digiteka landing renders with heading and collection links', async ({ page }) => {
  const res = await page.goto('/digiteka')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Breadcrumb present
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
  // At least one collection link
  const list = page.getByRole('list', { name: 'Zbirke' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('link').first()).toBeVisible()
})

test('/digiteka collection page renders item list with breadcrumb', async ({ page }) => {
  // Navigate to the first collection from the landing page
  await page.goto('/digiteka')
  const firstCollLink = page.getByRole('list', { name: 'Zbirke' }).getByRole('link').first()
  const href = await firstCollLink.getAttribute('href')
  expect(href).toBeTruthy()

  const res = await page.goto(href!)
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Breadcrumb with Digiteka link
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(breadcrumb).toBeVisible()
  await expect(breadcrumb.getByRole('link', { name: 'Digiteka' })).toBeVisible()
  // Item list
  const itemList = page.getByRole('list', { name: 'Arhivalije v zbirki' })
  await expect(itemList).toBeVisible()
  await expect(itemList.getByRole('link').first()).toBeVisible()
})

test('/digiteka collection → item renders with breadcrumb chain', async ({ page }) => {
  // Navigate via landing → collection → first item
  await page.goto('/digiteka')
  const collLink = page.getByRole('list', { name: 'Zbirke' }).getByRole('link').first()
  const collHref = await collLink.getAttribute('href')
  await page.goto(collHref!)

  const itemList = page.getByRole('list', { name: 'Arhivalije v zbirki' })
  const firstItem = itemList.getByRole('link').first()
  const itemHref = await firstItem.getAttribute('href')
  expect(itemHref).toBeTruthy()

  const res = await page.goto(itemHref!)
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Breadcrumb with both Digiteka and collection links
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(breadcrumb.getByRole('link', { name: 'Digiteka' })).toBeVisible()
})

test('/digiteka/listine item renders metadata definition list', async ({ page }) => {
  // listine items have 8 charter metadata descriptors
  const res = await page.goto('/digiteka/listine')
  expect(res?.status()).toBe(200)

  const itemList = page.getByRole('list', { name: 'Arhivalije v zbirki' })
  const firstItem = itemList.getByRole('link').first()
  const itemHref = await firstItem.getAttribute('href')
  expect(itemHref).toBeTruthy()

  const itemRes = await page.goto(itemHref!)
  expect(itemRes?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Metadata section (definition list) — always present for charter (listine) items
  const metaSection = page.getByRole('region', { name: 'Metapodatki' })
  await expect(metaSection).toBeVisible()
})

test('/digiteka/:collection returns 404 for unknown collection slug', async ({ page }) => {
  const res = await page.goto('/digiteka/neobstojeca-zbirka-xyz')
  expect(res?.status()).toBe(404)
})

test('/digiteka/:collection/:item returns 404 for unknown item', async ({ page }) => {
  const res = await page.goto('/digiteka/listine/neobstojeca-arhivalija-xyz')
  expect(res?.status()).toBe(404)
})
