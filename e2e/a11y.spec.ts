import { expect, test } from '@playwright/test'

// WCAG 2.1 AA structural assertions — skip link, landmark ids, keyboard nav,
// focus-visible, accordion keyboard. Never assert CMS copy.

test('skip link exists with correct href', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href="#main-content"]')).toBeAttached()
})

test('main landmark has id for skip link target', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main#main-content')).toBeAttached()
})

test('skip link is first Tab stop and enters viewport when focused', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.locator('a[href="#main-content"]')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeInViewport()
})

test('nav dropdown is keyboard accessible via focus', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Glavna navigacija' })
  // Items with dropdowns carry data-dropdown attribute
  const parentLi = nav.locator('li[data-dropdown]').first()
  const parentLink = parentLi.locator('a').first()

  await parentLink.focus()

  const dropdown = parentLi.locator('ul')
  await expect(dropdown).toBeVisible()
})

test('keyboard-focused elements have visible focus ring', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab') // skip link
  const skipLink = page.locator('a[href="#main-content"]')
  await expect(skipLink).toBeFocused()
  const outlineWidth = await skipLink.evaluate(
    (el) => parseFloat(getComputedStyle(el).outlineWidth),
  )
  expect(outlineWidth).toBeGreaterThan(0)
})

test('footer accordion button is keyboard operable', async ({ page }) => {
  await page.goto('/')
  const footer = page.getByRole('contentinfo')
  const accordionBtn = footer.locator('button[aria-expanded]').first()
  await accordionBtn.focus()
  await page.keyboard.press('Enter')
  await expect(accordionBtn).toHaveAttribute('aria-expanded', 'true')
})
