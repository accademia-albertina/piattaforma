import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    await expect(page.getByRole('heading', { level: 1, name: /^Ciao/ })).toBeVisible()
    const sezioni = page.getByRole('region', { name: 'Contenuti', exact: true })
    await expect(sezioni.getByRole('link', { name: 'Avvisi', exact: true })).toBeVisible()
    // Il pulsante «Apri il sito» sta nell'intestazione, su tutte le pagine del pannello
    await expect(page.getByRole('link', { name: /Apri il sito/ })).toHaveAttribute('href', '/')
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    // Da Payload 3.93 la lista aggiunge all'indirizzo i parametri predefiniti (?depth=1&limit=10)
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/admin\/collections\/users(\?.*)?$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Utenti' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
