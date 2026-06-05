import { expect, test } from '@playwright/test'

// Visual editing: structure-only checks against published build.
// Full preview-mode testing (drafts perspective, click-to-edit overlays) requires
// a live Sanity Studio session and is exercised manually via the Studio UI.

test('stega data-sanity attributes are absent from published HTML', async ({ page }) => {
  await page.goto('/')
  // Stega encoding embeds data-sanity attributes on text nodes in preview mode only.
  // In published mode these must not appear.
  const stegas = await page.locator('[data-sanity]').count()
  expect(stegas).toBe(0)
})

test('exit-preview button is not rendered in published mode', async ({ page }) => {
  await page.goto('/')
  // ExitPreview renders only when preview cookie is set (preview=true from loader).
  // In published mode the button must not be in the DOM.
  const exitBtn = page.getByRole('button', { name: 'Izhod iz predogleda' })
  await expect(exitBtn).not.toBeAttached()
})

test('exit-preview POST route returns redirect on action', async ({ request }) => {
  // POST /resource/preview destroys the preview session and redirects.
  // We just verify it returns a redirect (3xx) — no preview cookie needed.
  const response = await request.post('/resource/preview', {
    maxRedirects: 0,
  })
  expect(response.status()).toBeGreaterThanOrEqual(300)
  expect(response.status()).toBeLessThan(400)
})
