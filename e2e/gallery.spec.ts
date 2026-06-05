import { expect, test } from '@playwright/test'

// Structure-only assertions — never assert CMS copy.
// The galerija page must be re-seeded before this suite so gallery blocks are present.

test('galerija page renders a gallery grid', async ({ page }) => {
  const res = await page.goto('/galerija')
  expect(res?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // The gallery grid list
  const gallery = page.getByRole('list', { name: 'Galerija' })
  await expect(gallery).toBeVisible()
  // At least one gallery item button
  const firstBtn = gallery.getByRole('listitem').first().getByRole('button')
  await expect(firstBtn).toBeVisible()
})

test('galerija lightbox opens and closes via keyboard', async ({ page }) => {
  await page.goto('/galerija')

  const gallery = page.getByRole('list', { name: 'Galerija' })
  await expect(gallery).toBeVisible()

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
