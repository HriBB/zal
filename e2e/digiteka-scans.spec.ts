import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// Requires seed-scans to have been run for cod-i-knjiga-43-1674 (kodeksi collection).

const ITEM_URL = '/digiteka/kodeksi/cod-i-knjiga-43-1674'

test('charter item page renders scan gallery', async ({ page }) => {
  const res = await page.goto(ITEM_URL)
  expect(res?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Posnetki section is present
  const section = page.getByRole('region', { name: 'Posnetki' })
  await expect(section).toBeVisible()

  // Gallery grid with at least one image button
  const gallery = section.getByRole('list', { name: 'Galerija' })
  await expect(gallery).toBeVisible()
  const firstBtn = gallery.getByRole('listitem').first().getByRole('button')
  await expect(firstBtn).toBeVisible()
})

test('charter item gallery lightbox opens and closes', async ({ page }) => {
  await page.goto(ITEM_URL)

  const section = page.getByRole('region', { name: 'Posnetki' })
  const gallery = section.getByRole('list', { name: 'Galerija' })
  const firstBtn = gallery.getByRole('listitem').first().getByRole('button')

  await firstBtn.focus()
  await page.keyboard.press('Enter')

  // Lightbox dialog appears
  const dialog = page.getByRole('dialog', { name: 'Galerija slik' })
  await expect(dialog).toBeVisible()

  // Close via Escape
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})
