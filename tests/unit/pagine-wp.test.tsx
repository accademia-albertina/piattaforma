import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Documento } from '@/components'
import { estraiPagina, mappaPercorsi, type El } from '@/lib/wp-import/contenuti/pagine-html'

import { axeViolations } from './axe'

const WP = 'https://albertina-academy.it'
const mappa = mappaPercorsi(
  [
    { id: 27593, link: `${WP}/outgoing/` },
    { id: 3627, link: `${WP}/studente/tasse/` },
  ],
  new Map([['a-balzola', 'andrea-balzola']]),
)

/** HTML come lo genera Breakdance per le pagine istituzionali (ridotto all'essenziale). */
const html = `
<section class="bde-section">
  <div class="bde-breadcrumbs"><p>Home</p></div>
  <h1 class="bde-heading">Tasse</h1>
  <div class="bde-text">Ultimo aggiornamento: 6 Febbraio 2025</div>
  <h2 class="bde-heading">Pagamenti</h2>
  <div class="bde-rich-text"><p class="x" style="color:red">Leggi <a href="${WP}/outgoing/" target="_blank">Erasmus</a> e il prof. <a href="${WP}/docente/a.balzola/">Balzola</a>.</p></div>
  <div class="bde-icon-list"><ul>
    <li><a href="${WP}/wp-content/uploads/2026/09/regolamento.pdf"><span class="bde-icon-list__text">Scarica il regolamento tasse (PDF)</span></a></li>
  </ul></div>
  <div class="bde-shortcode"><a href="${WP}/wp-content/uploads/2026/09/regolamento.pdf">regolamento</a></div>
  <div class="bde-accordion">
    <div class="bde-accordion__content-wrapper">
      <h3><button><span class="bde-accordion__title">Esoneri</span></button></h3>
      <div class="bde-accordion__panel"><div class="bde-accordion__panel-content">
        <div class="bde-rich-text"><p>Chi ha ISEE basso.</p></div>
      </div></div>
    </div>
  </div>
  <div class="bde-frequently-asked-questions"><div class="bde-faq__item">
    <h3><button><span class="bde-faq__title">Quando si paga?</span></button></h3>
    <div class="bde-faq__answer"><div class="bde-faq__answer-content"><p>Entro il 31/10.</p></div></div>
  </div></div>
  <div class="bde-button"><a class="bde-button__button" href="mailto:tasse@albertina.academy"><span class="button-atom__text">Scrivi</span></a></div>
  <div class="bde-image2"><img src="x.jpg" alt=""></div>
</section>`

const radice = () => new DOMParser().parseFromString(html, 'text/html').body as unknown as El

describe('Pagine istituzionali: lettura dell’HTML di WordPress', () => {
  it('ricava testi, documento, fisarmonica e contatti come l’importazione iniziale', () => {
    const { blocchi, sommario } = estraiPagina(radice(), mappa, { titolo: 'Tasse' })
    expect(sommario).toBeNull()
    expect(blocchi.map((b) => b.tipo)).toEqual(['contatti', 'testo', 'documento', 'fisarmonica'])
    expect(blocchi[0]).toEqual({
      tipo: 'contatti',
      voci: [{ nome: 'Tasse', email: 'tasse@albertina.academy' }],
    })
    const testo = blocchi[1] as { html: string }
    // Titolo h1, data dinamica, briciole e immagini non diventano contenuto
    expect(testo.html).toBe(
      '<h2>Pagamenti</h2><p>Leggi <a href="/erasmus/mobilita-studenti">Erasmus</a> e il prof. <a href="/docenti/andrea-balzola">Balzola</a>.</p>',
    )
    // Il link "Scarica …" allo stesso PDF si fonde nel documento e ne diventa il titolo
    expect(blocchi[2]).toEqual({
      tipo: 'documento',
      nome: 'Regolamento tasse',
      url: `${WP}/wp-content/uploads/2026/09/regolamento.pdf`,
    })
    expect(blocchi[3]).toEqual({
      tipo: 'fisarmonica',
      voci: [
        { titolo: 'Esoneri', html: '<p>Chi ha ISEE basso.</p>' },
        { titolo: 'Quando si paga?', html: '<p>Entro il 31/10.</p>' },
      ],
    })
  })

  it('una pagina fatta solo di box verso le sottopagine diventa un sommario', () => {
    const box = `<section class="bde-section"><h1 class="bde-heading">Studente</h1>
      <div class="bde-rich-text"><p>Le pagine per gli studenti.</p></div>
      <h3 class="bde-heading">Tasse</h3><div class="bde-text">Pagamenti e scadenze.</div>
      <div class="bde-button"><a class="bde-button__button" href="${WP}/studente/tasse/"><span class="button-atom__text">Scopri di più</span></a></div>
    </section>`
    const doc = new DOMParser().parseFromString(box, 'text/html').body as unknown as El
    expect(estraiPagina(doc, mappa, { titolo: 'Studente' })).toEqual({
      blocchi: [],
      sommario: 'Le pagine per gli studenti.',
    })
  })

  it('pagina classica senza Breakdance: tutto il testo in un blocco', () => {
    const doc = new DOMParser().parseFromString(
      '<h2 class="wp-block-heading">Informativa</h2><p class="wp-block-paragraph">Testo.</p>',
      'text/html',
    ).body as unknown as El
    expect(estraiPagina(doc, mappa, { titolo: 'Privacy' }).blocchi).toEqual([
      { tipo: 'testo', html: '<h2>Informativa</h2><p>Testo.</p>' },
    ])
  })
})

describe('Documento in evidenza', () => {
  afterEach(cleanup)

  it('PDF: titolo, formato, Apri e Scarica, anteprima con titolo; accessibile', async () => {
    const { container } = render(
      <Documento
        id="doc"
        nome="Regolamento tasse 2026-27"
        url="/media/regolamento.pdf"
        filename="regolamento.pdf"
        mimeType="application/pdf"
        filesize={1_250_000}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Regolamento tasse 2026-27' })).toBeTruthy()
    expect(screen.getByText(/PDF · 1,2 MB/)).toBeTruthy()
    const apri = screen.getByRole('link', { name: /Apri Regolamento tasse/ })
    expect(apri.getAttribute('target')).toBe('_blank')
    expect(screen.getByRole('link', { name: /Scarica Regolamento tasse/ })).toBeTruthy()
    expect(container.querySelector('iframe')?.getAttribute('title')).toBe(
      'Anteprima: Regolamento tasse 2026-27',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('altri formati: niente anteprima né Apri', () => {
    const { container } = render(
      <Documento id="doc" nome="Modulo" url="/media/modulo.docx" filename="modulo.docx" />,
    )
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.queryByRole('link', { name: /Apri/ })).toBeNull()
  })
})
