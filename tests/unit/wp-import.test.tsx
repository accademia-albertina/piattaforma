import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import PannelloDrive, { type PropsPannelloDrive } from '@/components/admin/PannelloDrive'
import { riscriviLink, type MappaFile } from '@/lib/wp-import/riscrivi'
import type { StatoSincronizzazione } from '@/lib/wp-import/sincronizza'
import { chiaveWp, nomeFileDaWp } from '@/lib/wp-import/wordpress'

import { axeViolations } from './axe'

const WP = 'https://albertina-academy.it/wp-content/uploads'

describe('Chiave dei file WordPress', () => {
  it('riporta miniature, -scaled e indirizzi codificati al file originale', () => {
    const k = '2026/07/bando-ammissione.pdf'
    expect(chiaveWp(`${WP}/2026/07/bando-ammissione.pdf`)).toBe(k)
    expect(
      chiaveWp(
        `http://www.albertina-academy.it/wp-content/uploads/2026/07/Bando-Ammissione.pdf?x=1`,
      ),
    ).toBe(k)
    expect(chiaveWp(`${WP}/2024/05/Albertina012-1024x683.jpg`)).toBe('2024/05/albertina012.jpg')
    expect(chiaveWp(`${WP}/2024/05/Albertina012-scaled.jpg`)).toBe('2024/05/albertina012.jpg')
    expect(chiaveWp(`${WP}/2026/01/Graduatoria%20finale.pdf`)).toBe(
      '2026/01/graduatoria finale.pdf',
    )
  })

  it('ricava un nome di file pulito', () => {
    expect(nomeFileDaWp(`${WP}/2026/01/Graduatoria%20finale%C3%A0.pdf`)).toBe(
      'Graduatoria-finalea.pdf',
    )
    expect(nomeFileDaWp(`${WP}/2026/11/Prot.-n.-7962_omissis.pdf`)).toBe(
      'Prot.-n.-7962_omissis.pdf',
    )
  })
})

describe('Riscrittura dei link', () => {
  const mappa: MappaFile = new Map([
    ['2026/07/bando.pdf', { id: 7, url: '/api/media/file/bando.pdf', nome: 'Bando 2026' }],
    ['2024/05/albertina012.jpg', { id: 8, url: '/api/media/file/Albertina012.jpg' }],
  ])

  it('trasforma le righe documento in file caricati', () => {
    const doc = {
      titolo: 'Bando',
      documenti: [
        { id: 'a', nome: 'Bando', url: `${WP}/2026/07/bando.pdf`, file: null },
        { id: 'b', nome: 'Altro', url: 'https://example.org/x.pdf', file: null },
        { id: 'c', nome: 'Rotto', url: `${WP}/2024/12/rotto.pdfdf`, file: null },
      ],
    }
    const e = riscriviLink(doc, mappa)
    expect(e.cambiati).toBe(1)
    expect(e.nonTrovati).toEqual([`${WP}/2024/12/rotto.pdfdf`])
    const v = e.valore as typeof doc
    expect(v.documenti[0]).toEqual({ id: 'a', nome: 'Bando', url: null, file: 7 })
    expect(v.documenti[1]).toEqual(doc.documenti[1])
    expect(v.documenti[2]).toEqual(doc.documenti[2])
  })

  it('sostituisce i link nel testo formattato; il testo resta, se non è l’indirizzo nudo', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                fields: { url: `${WP}/2024/05/Albertina012-1024x683.jpg`, linkType: 'custom' },
                children: [{ type: 'text', text: `Foto ${WP}/2026/07/bando.pdf` }],
              },
              {
                type: 'link',
                fields: { url: `${WP}/2026/07/bando.pdf`, linkType: 'custom' },
                children: [{ type: 'text', text: `${WP}/2026/07/bando.pdf` }],
              },
            ],
          },
        ],
      },
    }
    const e = riscriviLink({ contenuto: lexical }, mappa)
    expect(e.cambiati).toBe(3)
    const s = JSON.stringify(e.valore)
    expect(s).toContain('"url":"/api/media/file/Albertina012.jpg"')
    expect(s).toContain(`"text":"Foto ${WP}/2026/07/bando.pdf"`)
    expect(s).toContain('"url":"/api/media/file/bando.pdf"')
    expect(s).toContain('"text":"Bando 2026"')
  })

  it('non cambia nulla se non ci sono link a WordPress', () => {
    const doc = { a: 'testo', b: [{ url: 'https://example.org' }], n: 3 }
    const e = riscriviLink(doc, mappa)
    expect(e.cambiati).toBe(0)
    expect(e.valore).toEqual(doc)
  })
})

const stato: StatoSincronizzazione = {
  inCorso: false,
  fase: 'finito',
  finitoIl: '2026-11-13T16:00:00.000Z',
  limite: 20,
  suWordPress: 3278,
  daFare: 20,
  fatti: 20,
  nuovi: 19,
  aggiornati: 0,
  invariati: 0,
  errori: [`${WP}/2026/01/x.pdf: download 404`],
  toltiDaWp: 0,
  contenutiAggiornati: 12,
  linkRiscritti: 14,
  linkNonTrovati: [`${WP}/2024/12/rotto.pdfdf`],
  linkNonTrovatiTotale: 1,
  contenutiNonSalvati: [],
}

const base: PropsPannelloDrive = {
  account: 'noreply@albertina.academy',
  configurato: true,
  mancanti: [],
  collegato: true,
  email: 'noreply@albertina.academy',
  idCartella: 'cartella123',
  cartella: { nome: 'Sito Albertina – file' },
  suDisco: 0,
  spostamento: { inCorso: false, totale: 0, spostati: 0, mancanti: [], errori: [] },
  wordpress: { stato, importati: 19, suWordPress: 3278 },
}

describe('Pannello: file dal sito WordPress', () => {
  afterEach(cleanup)

  it('mostra conteggi, esito dell’ultima importazione e pulsanti, senza violazioni', async () => {
    const { container } = render(<PannelloDrive {...base} />)
    expect(screen.getByRole('heading', { name: 'File dal sito WordPress' })).toBeTruthy()
    expect(screen.getByText(/ne mancano 3\.259/)).toBeTruthy()
    expect(screen.getByText(/19 file nuovi/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Importa i file nuovi e modificati' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Prova con 20 file' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('durante l’importazione mostra l’avanzamento e il pulsante Ferma', async () => {
    const { container } = render(
      <PannelloDrive
        {...base}
        wordpress={{
          ...base.wordpress!,
          stato: { ...stato, inCorso: true, fase: 'file', fatti: 120, daFare: 3259 },
        }}
      />,
    )
    expect(screen.getByRole('status').textContent).toContain('120 di 3.259')
    expect(screen.getByRole('button', { name: 'Ferma' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Prova con 20 file' })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('senza Drive collegato non propone l’importazione', () => {
    render(<PannelloDrive {...base} collegato={false} />)
    expect(screen.queryByRole('button', { name: /Importa/ })).toBeNull()
  })
})
