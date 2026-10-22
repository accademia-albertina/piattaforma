import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BASE = 'http://localhost:3000'

let payload: Payload

/** Testo Lexical minimo con un solo paragrafo. */
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

test.describe('Pagine istituzionali', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pagine', where: {} })
    const didattica = await payload.create({
      collection: 'pagine',
      draft: false,
      data: { titolo: 'Didattica', _status: 'published' },
    })
    await payload.create({
      collection: 'pagine',
      draft: false,
      data: {
        titolo: 'Ammissioni',
        sommario: 'Come si entra in Accademia: requisiti, scadenze e prove.',
        genitore: didattica.id,
        _status: 'published',
        blocchi: [
          { blockType: 'testo', testo: paragrafo('Le domande si presentano su Isidata.') },
          {
            blockType: 'fisarmonica',
            titolo: 'Domande frequenti',
            voci: [
              { titolo: 'Serve un portfolio?', testo: paragrafo('Sì, in un unico PDF.') },
              { titolo: 'Quando sono le prove?', testo: paragrafo('A settembre.') },
            ],
          },
          {
            blockType: 'contatti',
            titolo: 'Contatti',
            voci: [{ nome: 'Segreteria didattica', email: 'segreteria@albertina.academy' }],
          },
        ],
      },
    })
    await payload.create({
      collection: 'pagine',
      draft: true,
      data: { titolo: 'Pagina in lavorazione', genitore: didattica.id },
    })
  })

  test('pagina a blocchi con briciole, fisarmonica e nessuna violazione', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/didattica/ammissioni`)
    await expect(page.getByRole('heading', { level: 1, name: 'Ammissioni' })).toBeVisible()
    const percorso = page.getByRole('navigation', { name: 'Percorso' })
    await expect(percorso.getByRole('link', { name: 'Didattica' })).toHaveAttribute(
      'href',
      '/didattica',
    )

    const voce = page.getByRole('button', { name: 'Serve un portfolio?' })
    await voce.focus()
    await page.keyboard.press('Enter')
    await expect(voce).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Sì, in un unico PDF.')).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    await context.close()
  })

  test('la pagina genitore elenca le sottopagine pubblicate', async ({ page }) => {
    await page.goto(`${BASE}/didattica`)
    const sezione = page.getByRole('navigation', { name: 'In questa sezione' })
    await expect(sezione.getByRole('link', { name: /Ammissioni/ })).toBeVisible()
    await expect(sezione.getByText('Pagina in lavorazione')).toHaveCount(0)
  })

  test('una bozza non è visibile al pubblico', async ({ page }) => {
    const res = await page.goto(`${BASE}/didattica/pagina-in-lavorazione`)
    expect(res?.status()).toBe(404)
  })
})
