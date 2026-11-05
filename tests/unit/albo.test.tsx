import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ElencoDocumenti } from '@/components'
import { formatoDocumento, hrefDocumento, inCorso } from '@/lib/albo'
import { hrefAlbo, parseFiltriAlbo, sezioneValida } from '@/lib/albo-dati'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Albo e trasparenza', () => {
  it('ElencoDocumenti mostra nome, formato e nota senza violazioni axe', async () => {
    const { container } = render(
      <ElencoDocumenti
        documenti={[
          { nome: 'Bando', url: 'https://example.org/bando.pdf', nota: 'Approvato il 3 marzo.' },
          { nome: 'Piattaforma domande', url: 'https://example.org/domande' },
          { nome: 'Senza indirizzo' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: /Bando/ }).getAttribute('href')).toBe(
      'https://example.org/bando.pdf',
    )
    expect(screen.getByText('PDF')).toBeTruthy()
    expect(screen.getByText('Approvato il 3 marzo.')).toBeTruthy()
    expect(screen.queryByText('Senza indirizzo')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(await axeViolations(container)).toEqual([])
  })

  it('ElencoDocumenti vuoto non rende nulla', () => {
    const { container } = render(<ElencoDocumenti documenti={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('il file caricato vince sul link', () => {
    expect(
      hrefDocumento({ nome: 'x', url: 'https://a.it/1.pdf', file: { url: '/media/2.pdf' } }),
    ).toBe('/media/2.pdf')
    expect(hrefDocumento({ nome: 'x', url: '  ', file: 3 })).toBeNull()
    expect(formatoDocumento('https://a.it/file.DOCX?x=1')).toBe('DOCX')
    expect(formatoDocumento('https://a.it/pagina')).toBeNull()
  })

  it('inCorso vale fino a fine giornata', () => {
    const oggi = new Date(2026, 10, 5, 18)
    expect(inCorso(new Date(2026, 10, 5).toISOString(), oggi)).toBe(true)
    expect(inCorso(new Date(2026, 10, 4).toISOString(), oggi)).toBe(false)
    expect(inCorso(null, oggi)).toBe(false)
  })

  it('filtri dell’Albo: valori ripuliti e indirizzi stabili', () => {
    const f = parseFiltriAlbo({ q: ['  modelli ', 'x'], pagina: '-3', solo: 'tutti' })
    expect(f).toEqual({ categoria: '', anno: '', q: 'modelli', pagina: 1, solo: '' })
    expect(hrefAlbo('bandi-di-gara', { categoria: 'Servizi', solo: 'aperti', pagina: 2 })).toBe(
      '/albo/bandi-di-gara?categoria=Servizi&solo=aperti&pagina=2',
    )
    expect(sezioneValida('sindacale')).toBe(true)
    expect(sezioneValida('admin')).toBe(false)
  })
})
