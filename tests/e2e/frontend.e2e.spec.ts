import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('Frontend', () => {
  test('homepage in italiano con titolo istituzionale', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Accademia Albertina/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'it')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('homepage senza violazioni WCAG 2.1 AA', async ({ page }) => {
    await page.goto('http://localhost:3000')
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('mega menu accessibile da tastiera', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000')
    const toggle = page.getByRole('button', { name: 'Menu' })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const menu = page.getByRole('navigation', { name: 'Principale' })
    await expect(menu.getByRole('link', { name: 'Tutti gli avvisi' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })

  test('skip link porta al contenuto', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Vai al contenuto principale' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#contenuto')).toBeFocused()
  })

  test('header di sicurezza presenti', async ({ request }) => {
    const res = await request.get('http://localhost:3000')
    const headers = res.headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-powered-by']).toBeUndefined()
  })
})
