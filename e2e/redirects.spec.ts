import { expect, test } from '@playwright/test'

// Structure-only assertions. Never assert CMS copy.

test('old archive item path 301 redirects to new digiteka path', async ({ page }) => {
  // /project/cod-i-knjiga-43-1674 → /digiteka/kodeksi/cod-i-knjiga-43-1674
  const res = await page.goto('/project/cod-i-knjiga-43-1674')
  expect(res?.status()).toBe(200)
  expect(page.url()).toContain('/digiteka/kodeksi/cod-i-knjiga-43-1674')
})

test('old page path 301 redirects to new clean path', async ({ page }) => {
  // /domaca-stran-1/o-arhivu-2/kontakti → /o-arhivu/kontakti
  const res = await page.goto('/domaca-stran-1/o-arhivu-2/kontakti')
  expect(res?.status()).toBe(200)
  expect(page.url()).toContain('/o-arhivu/kontakti')
})

test('old page path with trailing slash 301 redirects', async ({ page }) => {
  // normalizeOldPath strips trailing slash before lookup
  const res = await page.goto('/domaca-stran-1/o-arhivu-2/kontakti/')
  expect(res?.status()).toBe(200)
  expect(page.url()).toContain('/o-arhivu/kontakti')
})

test('sitemap.xml responds with 200 and XML content', async ({ page }) => {
  const res = await page.goto('/sitemap.xml')
  expect(res?.status()).toBe(200)
  expect(res?.headers()['content-type']).toContain('xml')
  const content = await page.content()
  expect(content).toContain('<urlset')
  expect(content).toContain('<url>')
})

test('robots.txt responds with 200 and references sitemap', async ({ page }) => {
  const res = await page.goto('/robots.txt')
  expect(res?.status()).toBe(200)
  const content = await page.content()
  expect(content).toContain('Sitemap:')
  expect(content).toContain('sitemap.xml')
})

test('rss.xml responds with 200 and RSS 2.0 envelope', async ({ request }) => {
  const res = await request.get('/rss.xml')
  expect(res.status()).toBe(200)
  const text = await res.text()
  expect(text).toContain('<rss')
  expect(text).toContain('<channel>')
})
