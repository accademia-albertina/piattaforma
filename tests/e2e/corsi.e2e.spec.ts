import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import { annoAccademicoCorrente } from '@/access/corsi'
import config from '@/payload.config'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BASE = 'http://localhost:3000'
const ANNO = annoAccademicoCorrente()
const ANNO_PRIMA = `${Number(ANNO.slice(0, 4)) - 1}/${ANNO.slice(0, 4)}`

let payload: Payload

async function violazioni(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map((v) => `${v.id}: ${v.help}`)
}

function paragrafo(testo: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children: [
            {
              type: 'text',
              text: testo,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        },
      ],
    },
  } as never
}

test.describe('Corsi e docenti', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'corsi', where: {} })
    await payload.delete({ collection: 'docenti', where: {} })
    await payload.delete({ collection: 'scuole', where: {} })
    const pittura = await payload.create({
      collection: 'scuole',
      data: { nome: 'Pittura', sigla: 'PIT' },
    })
    const verdi = await payload.create({
      collection: 'docenti',
      data: {
        nome: 'Giulia',
        cognome: 'Verdi',
        email: 'giulia.verdi@albertina.academy',
        ruolo: 'tempo-indeterminato',
        ricevimento: 'Martedì 10–11, su appuntamento',
        scuole: [pittura.id],
      },
    })
    const neri = await payload.create({
      collection: 'docenti',
      data: { nome: 'Luca', cognome: 'Neri' },
    })
    const corso = (data: Record<string, unknown>) =>
      payload.create({
        collection: 'corsi',
        draft: false,
        data: { _status: 'published', annoAccademico: ANNO, ...data } as never,
      })
    await corso({
      titolo: 'Pittura 1',
      livelli: ['triennio'],
      docenti: [verdi.id],
      scuole: [pittura.id],
      crediti: 12,
      settore: 'ABAV05',
      descrizione: paragrafo('Il corso introduce alle tecniche della pittura a olio.'),
      orari: [
        { semestre: 'primo', giorno: 'lunedi', dalle: '09:00', alle: '13:00', aula: 'Aula 12' },
      ],
    })
    await corso({ titolo: 'Fotografia', livelli: ['biennio'], docenti: [neri.id], crediti: 6 })
    await corso({
      titolo: 'Pittura 1',
      livelli: ['triennio'],
      docenti: [verdi.id],
      annoAccademico: ANNO_PRIMA,
    })
  })

  test.afterAll(async () => {
    await payload.delete({ collection: 'corsi', where: {} })
    await payload.delete({ collection: 'docenti', where: {} })
    await payload.delete({ collection: 'scuole', where: {} })
  })

  test('catalogo dell’anno in corso, filtri e nessuna violazione', async ({ page }) => {
    await page.goto(`${BASE}/corsi`)
    await expect(page.getByRole('heading', { level: 1, name: 'Corsi' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('2 corsi')
    expect(await violazioni(page)).toEqual([])

    await page.getByLabel('Livello').selectOption('biennio')
    await page.getByRole('button', { name: 'Cerca' }).click()
    await expect(page.getByRole('status')).toContainText('1 corso')
    await expect(page.getByRole('link', { name: 'Fotografia' })).toBeVisible()

    await page.goto(`${BASE}/corsi?q=verdi`)
    await expect(page.getByRole('status')).toContainText('1 corso per “verdi”')

    await page.goto(`${BASE}/corsi?anno=${ANNO_PRIMA.replace('/', '-')}`)
    await expect(page.getByRole('status')).toContainText('1 corso')
  })

  test('scheda del corso con docente, orari e dati strutturati', async ({ page }) => {
    await page.goto(`${BASE}/corsi`)
    await page.getByRole('link', { name: 'Pittura 1' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Pittura 1' })).toBeVisible()
    await expect(
      page.getByText('Il corso introduce alle tecniche della pittura a olio.'),
    ).toBeVisible()
    await expect(page.getByText('Lunedì, 09:00–13:00 · Aula 12')).toBeVisible()
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    expect(JSON.parse(jsonLd ?? '{}')['@type']).toBe('Course')
    expect(await violazioni(page)).toEqual([])
  })

  test('elenco docenti e profilo con corsi degli anni precedenti', async ({ page }) => {
    await page.goto(`${BASE}/docenti`)
    await expect(page.getByRole('heading', { level: 1, name: 'Docenti' })).toBeVisible()
    expect(await violazioni(page)).toEqual([])
    await page.getByRole('link', { name: 'Verdi Giulia' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Giulia Verdi' })).toBeVisible()
    await expect(page.getByText('Martedì 10–11, su appuntamento')).toBeVisible()
    const passati = page.getByRole('button', { name: `A.A. ${ANNO_PRIMA}` })
    await passati.click()
    await expect(passati).toHaveAttribute('aria-expanded', 'true')
    expect(await violazioni(page)).toEqual([])
  })

  test('una bozza o un corso inesistente danno 404', async ({ request }) => {
    expect((await request.get(`${BASE}/corsi/non-esiste`)).status()).toBe(404)
    expect((await request.get(`${BASE}/docenti/non-esiste`)).status()).toBe(404)
  })
})
