import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import ContenutiWordPress from '@/components/admin/ContenutiWordPress'
import { attiDaPagina, testoDaHtml } from '@/lib/wp-import/contenuti/albo-html'
import { allegatiAvviso, pulisciHtml } from '@/lib/wp-import/contenuti/converti'
import type { AvvisoRest } from '@/lib/wp-import/contenuti/fonti'
import type { StatoContenuti } from '@/lib/wp-import/contenuti/sincronizza-contenuti'

import { axeViolations } from './axe'

const WP = 'https://albertina-academy.it/wp-content/uploads'

/** HTML come lo genera Breakdance per le pagine dell'Albo (ridotto all'essenziale). */
const pagina = `
<h1 class="bde-heading">Albo Sindacale</h1><div class="bde-text">Albo online</div>
<div class="bde-accordion">
  <h2><button><span class="bde-accordion__title">Scioperi</span></button></h2>
  <div class="bde-rich-text"><p>Anno 2026</p></div>
  <div class="bde-rich-text"><p>Sciopero generale del 30/10/2026&nbsp;– </p></div>
  <div class="bde-icon-list"><ul>
    <li><a href="${WP}/2026/10/sciopero.pdf"><span class="bde-icon-list__text"> Proclamazione <br> sciopero </span></a></li>
    <li><a href="${WP}/2026/11/adesioni.pdf"><span class="bde-icon-list__text">Adesioni</span></a></li>
    <li><a href="#"><span class="bde-icon-list__text">Link vuoto</span></a></li>
  </ul></div>
  <div class="bde-rich-text"><p>Titolo senza documenti</p></div>
  <h2><button><span class="bde-accordion__title">Comunicazioni</span></button></h2>
  <div class="bde-icon-list"><ul>
    <li><a href="${WP}/2026/09/uil.pdf"><span class="bde-icon-list__text">UIL – cambio sede (scad. 5/1/2027)</span></a></li>
  </ul></div>
</div>`

describe('Albo: lettura delle pagine WordPress', () => {
  it('ricava categorie, anno, atti e documenti come lo script di importazione', () => {
    const doc = new DOMParser().parseFromString(pagina, 'text/html')
    const atti = attiDaPagina(doc, 'sindacale')
    expect(atti).toEqual([
      {
        sezione: 'sindacale',
        categoria: 'Scioperi',
        anno: '2026',
        titolo: 'Sciopero generale del 30/10/2026',
        pubblicatoIl: '2026-10-01',
        scadenza: null,
        documenti: [
          { nome: 'Proclamazione sciopero', url: `${WP}/2026/10/sciopero.pdf` },
          { nome: 'Adesioni', url: `${WP}/2026/11/adesioni.pdf` },
        ],
      },
      {
        // documento senza titolo sopra: è un atto a sé
        sezione: 'sindacale',
        categoria: 'Comunicazioni',
        anno: null,
        titolo: 'UIL – cambio sede (scad. 5/1/2027)',
        pubblicatoIl: '2026-09-01',
        scadenza: '2027-01-05',
        documenti: [{ nome: 'UIL – cambio sede (scad. 5/1/2027)', url: `${WP}/2026/09/uil.pdf` }],
      },
    ])
  })

  it('decodifica le entità e toglie trattini ai bordi', () => {
    expect(testoDaHtml(' – Bando d&#8217;arte &amp; design<br>2026 - ')).toBe(
      'Bando d’arte & design 2026',
    )
  })
})

describe('Avvisi: conversione da WordPress', () => {
  it('legge fino a cinque allegati dai campi ACF', () => {
    const a = {
      acf: {
        nome_allegato: 'Bando',
        documento: 45551,
        nome_allegato_2: '',
        documento_2: 45552,
        documento_3: '',
        documento_4: null,
        documento_5: false,
      },
    } as unknown as AvvisoRest
    expect(allegatiAvviso(a)).toEqual([
      { nome: 'Bando', idWp: 45551 },
      { nome: '', idWp: 45552 },
    ])
  })

  it('toglie commenti dei blocchi, immagini e paragrafi vuoti', () => {
    expect(
      pulisciHtml(
        '<!-- wp:paragraph --><p>Testo</p><!-- /wp:paragraph --><p>&nbsp;</p><figure><img src="x"></figure>',
      ),
    ).toBe('<p>Testo</p>')
  })
})

const vuoto = {
  suWordPress: 0,
  nuovi: 0,
  aggiornati: 0,
  invariati: 0,
  collegati: 0,
  protetti: 0,
  daControllare: [],
  nonPiuSuWp: [],
  nonPiuSuWpTotale: 0,
  errori: [],
}

const finito: StatoContenuti = {
  inCorso: false,
  fase: 'finito',
  avviatoIl: '2026-11-14T10:00:00.000Z',
  finitoIl: '2026-11-14T10:05:00.000Z',
  fatti: 3,
  daFare: 3,
  albo: { ...vuoto, suWordPress: 419, nuovi: 6, invariati: 412, collegati: 412 },
  trasparenza: {
    ...vuoto,
    suWordPress: 94,
    aggiornati: 2,
    invariati: 91,
    protetti: 1,
    daControllare: ['Bilanci (/admin/collections/trasparenza/12)'],
  },
  avvisi: {
    ...vuoto,
    suWordPress: 1203,
    nuovi: 126,
    invariati: 1077,
    nonPiuSuWp: ['Avviso tolto (/admin/collections/avvisi/9)'],
    nonPiuSuWpTotale: 1,
  },
  pagineModificate: [
    {
      titolo: 'Modulistica',
      url: 'https://albertina-academy.it/studente/modulistica/',
      modificato: '2026-11-07T18:32:13.000Z',
    },
  ],
  fileImportati: 40,
  errori: [],
}

describe('Pannello: contenuti dal sito WordPress', () => {
  afterEach(cleanup)
  const collegati = { albo: 412, trasparenza: 93, avvisi: 1077 }

  it('mostra l’esito con i contenuti da controllare, accessibile', async () => {
    const { container } = render(<ContenutiWordPress stato={finito} collegati={collegati} attivo />)
    expect(screen.getByRole('button', { name: 'Sincronizza i contenuti' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Bilanci' }).getAttribute('href')).toBe(
      '/admin/collections/trasparenza/12',
    )
    expect(screen.getByText(/126 nuovi/)).toBeTruthy()
    expect(screen.getByText(/pagine modificate su WordPress/)).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('durante la sincronizzazione mostra l’avanzamento e il pulsante Ferma', async () => {
    const { container } = render(
      <ContenutiWordPress
        stato={{ ...finito, inCorso: true, fase: 'avvisi', fatti: 40, daFare: 126 }}
        collegati={collegati}
        attivo
      />,
    )
    expect(screen.getByRole('status').textContent).toContain('Avvisi: 40 di 126')
    expect(screen.getByRole('button', { name: 'Ferma' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })
})
