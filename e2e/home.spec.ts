import { expect, test } from '@playwright/test'

// Structural / route invariants against the production build — never CMS copy.
// These assert "the route works and is shaped right", so later content edits
// don't break them.

test('home page renders SSR with header, main and footer landmarks', async ({
  page,
}) => {
  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('banner')).toBeVisible() // the site <header>
  await expect(page.getByRole('main')).toBeVisible() // the <main> region
  await expect(page.getByRole('contentinfo')).toBeVisible() // the <footer>
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('home hero section has h1 and search form', async ({ page }) => {
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Hero' })
  await expect(hero).toBeVisible()
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible()
  const form = hero.locator('form')
  await expect(form).toBeVisible()
  await expect(form.locator('input[name="q"]')).toBeVisible()
  await expect(form.getByRole('button', { name: /išči/i })).toBeVisible()
})

test('home service cards section renders links', async ({ page }) => {
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Storitve' })
  await expect(section).toBeVisible()
  const links = section.getByRole('link')
  await expect(links.first()).toBeVisible()
})

test('home news grid renders', async ({ page }) => {
  await page.goto('/')
  const news = page.getByRole('region', { name: 'Aktualno' })
  await expect(news).toBeVisible()
  await expect(news.getByRole('heading', { level: 2 })).toBeVisible()
  await expect(news.getByRole('link', { name: /vse objave/i })).toBeVisible()
})

test('home unit strip renders five unit links', async ({ page }) => {
  await page.goto('/')
  const strip = page.getByRole('region', { name: 'Območne enote' })
  await expect(strip).toBeVisible()
  await expect(strip.getByRole('heading', { level: 2 })).toBeVisible()
  const links = strip.getByRole('link')
  await expect(links).toHaveCount(5)
  const first = links.first()
  const href = await first.getAttribute('href')
  expect(href).toMatch(/^\/enote\//)
})

test('home arhivalija band renders when post exists', async ({ page }) => {
  await page.goto('/')
  const band = page.getByRole('region', { name: 'Arhivalija meseca' })
  await expect(band).toBeVisible()
  const readLink = band.getByRole('link', { name: /preberi zgodbo/i })
  await expect(readLink).toBeVisible()
  const href = await readLink.getAttribute('href')
  expect(href).toMatch(/^\/novice\//)
})
