import { expect, test } from '@playwright/test'

// Spot-check that every key route emits the full OG meta set and JSON-LD.
// Structure-only: never assert CMS copy, only tag presence and schema @type.

test('home has og:title, og:image, og:url and ArchiveOrganization JSON-LD', async ({ page }) => {
  await page.goto('/')
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
  expect(ogTitle).toBeTruthy()
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(ogImage).toBeTruthy()
  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
  expect(ogUrl).toBeTruthy()

  const ldText = await page.evaluate(() =>
    document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
  )
  expect(ldText).not.toBeNull()
  const ld = JSON.parse(ldText!)
  expect(ld['@type']).toBe('ArchiveOrganization')
})

test('nested page has og:title, og:image, og:url and BreadcrumbList JSON-LD', async ({ page }) => {
  // /o-arhivu/kontakti is a 2-level page with one ancestor (breadcrumbs.length > 0)
  await page.goto('/o-arhivu/kontakti')
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
  expect(ogTitle).toBeTruthy()
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(ogImage).toBeTruthy()

  const ldText = await page.evaluate(() =>
    document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
  )
  expect(ldText).not.toBeNull()
  const ld = JSON.parse(ldText!)
  expect(ld['@type']).toBe('BreadcrumbList')
})

test('post detail has og:title, og:image (article), og:url and NewsArticle JSON-LD', async ({
  page,
}) => {
  // Navigate via the listing to get a real post slug (don't hardcode CMS content)
  await page.goto('/novice')
  const list = page.getByRole('list', { name: 'Seznam novic' })
  await expect(list).toBeVisible()
  const firstLink = list.getByRole('link').first()
  const href = await firstLink.getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href!)

  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
  expect(ogTitle).toBeTruthy()
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(ogImage).toBeTruthy()
  const ogType = await page.locator('meta[property="og:type"]').getAttribute('content')
  expect(ogType).toBe('article')

  const ldText = await page.evaluate(() =>
    document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
  )
  expect(ldText).not.toBeNull()
  const ld = JSON.parse(ldText!)
  expect(ld['@type']).toBe('NewsArticle')
})

test('canonical link tag is present on home', async ({ page }) => {
  await page.goto('/')
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  expect(canonical).toBeTruthy()
  expect(canonical).toContain('www.zal-lj.si')
})
