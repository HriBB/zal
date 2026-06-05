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
