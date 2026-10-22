import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BASE = 'http://localhost:3000'

let payload: Payload

async function violazioni(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map((v) => `${v.id}: ${v.help}`)
}

test.describe('Avvisi', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'avvisi', where: {} })
    await payload.delete({ collection: 'scuole', where: {} })
    const pittura = await payload.create({
      collection: 'scuole',
      data: { nome: 'Pittura', sigla: 'PIT' },
    })
    await payload.create({ collection: 'scuole', data: { nome: 'Scultura', sigla: 'SCU' } })
    const ora = Date.now()
    for (let i = 1; i <= 14; i++) {
      await payload.create({
        collection: 'avvisi',
        draft: false,
        data: {
          titolo: `Avviso di prova ${i}`,
          sommario: `Sommario dell’avviso ${i}.`,
          categorie: i % 2 ? ['lezioni'] : ['esami'],
          scuole: i === 1 ? [pittura.id] : [],
          pubblicatoIl: new Date(ora - i * 3_600_000).toISOString(),
          _status: 'published',
        },
      })
    }
    await payload.create({
      collection: 'avvisi',
      draft: false,
      data: {
        titolo: 'Open Days 2026',
        categorie: ['in-evidenza', 'eventi'],
        pubblicatoIl: new Date(ora - 100 * 3_600_000).toISOString(),
        _status: 'published',
      },
    })
    await payload.create({
      collection: 'avvisi',
      draft: true,
      data: {
        titolo: 'Bozza nascosta',
        categorie: ['generali'],
        pubblicatoIl: new Date(ora).toISOString(),
      },
    })
  })

  test.afterAll(async () => {
    await payload.delete({ collection: 'avvisi', where: {} })
    await payload.delete({ collection: 'scuole', where: {} })
  })

  test('elenco con paginazione, senza bozze e senza violazioni WCAG', async ({ page }) => {
    await page.goto(`${BASE}/avvisi`)
    await expect(page.getByRole('heading', { level: 1, name: 'Avvisi' })).toBeVisible()
    await expect(page.getByText('15 avvisi')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bozza nascosta' })).toHaveCount(0)
    await expect(page.locator('main ul li h2')).toHaveCount(12)
    await expect(page.getByRole('navigation', { name: 'Paginazione' })).toBeVisible()
    expect(await violazioni(page)).toEqual([])
  })

  test('filtro per categoria e per scuola', async ({ page }) => {
    await page.goto(`${BASE}/avvisi`)
    await page
      .getByRole('navigation', { name: 'Categorie degli avvisi' })
      .getByRole('link', { name: 'Esami' })
      .click()
    await expect(page).toHaveURL(/categoria=esami/)
    await expect(page.getByText('7 avvisi in “Esami”')).toBeVisible()

    await page.goto(`${BASE}/avvisi`)
    await page.getByLabel('Scuola').selectOption('pittura')
    await page.getByRole('button', { name: 'Applica' }).click()
    await expect(page.getByText('1 avviso per Pittura')).toBeVisible()
    expect(await violazioni(page)).toEqual([])
  })

  test('dettaglio con percorso e dati strutturati', async ({ page }) => {
    await page.goto(`${BASE}/avvisi`)
    await page.getByRole('link', { name: 'Avviso di prova 1', exact: true }).click()
    await expect(page).toHaveURL(/\/avvisi\/avviso-di-prova-1$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Avviso di prova 1' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Percorso' })).toBeVisible()
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    expect(JSON.parse(jsonLd ?? '{}')['@type']).toBe('NewsArticle')
    expect(await violazioni(page)).toEqual([])
  })

  test('una bozza o un indirizzo inesistente danno 404', async ({ request }) => {
    expect((await request.get(`${BASE}/avvisi/bozza-nascosta`)).status()).toBe(404)
    expect((await request.get(`${BASE}/avvisi/non-esiste`)).status()).toBe(404)
  })

  test('la homepage mostra gli ultimi avvisi', async ({ page }) => {
    await page.goto(BASE)
    const sezione = page.getByRole('region', { name: 'Ultimi avvisi' })
    await expect(sezione.getByRole('heading', { level: 3 })).toHaveCount(6)
    await expect(sezione.getByRole('heading', { level: 3 }).first()).toHaveText('Avviso di prova 1')
  })

  test('lo slider in homepage mostra gli avvisi in evidenza', async ({ page }) => {
    await page.goto(BASE)
    const slider = page.getByRole('region', { name: 'Avvisi in evidenza' })
    await expect(slider.getByRole('heading', { level: 2, name: 'Open Days 2026' })).toBeVisible()
    await slider.getByRole('link', { name: /Leggi l’avviso/ }).click()
    await expect(page).toHaveURL(/\/avvisi\/open-days-2026$/)
  })

  test('la ricerca trova gli avvisi per titolo', async ({ page }) => {
    await page.goto(BASE)
    await page.getByRole('link', { name: 'Cerca nel sito' }).click()
    await page.getByLabel('Cosa cerchi?').fill('prova 1')
    await page.getByRole('button', { name: 'Cerca' }).click()
    await expect(page.getByRole('status')).toContainText('per “prova 1”')
    await expect(page.getByRole('link', { name: 'Avviso di prova 1', exact: true })).toBeVisible()
    expect(await violazioni(page)).toEqual([])
  })
})
