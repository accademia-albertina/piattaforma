import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { Attachments, ElencoDocumenti } from '@/components'
import { Visualizzatore } from '@/components/Visualizzatore/Visualizzatore'
import { zoomVicino } from '@/components/Visualizzatore/strumenti'
import { apreNuovaScheda, attributiFile, tipoAnteprima } from '@/utilities/pdf'

import { axeViolations } from './axe'

beforeAll(() => {
  // jsdom non ha ResizeObserver né IntersectionObserver
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
})

afterEach(cleanup)

describe('visualizzatore: quali file apre', () => {
  it('PDF e immagini del sito sì, file esterni e altri formati no', () => {
    expect(tipoAnteprima('/api/media/file/bando.pdf')).toBe('pdf')
    expect(tipoAnteprima('/api/media/file/x', 'application/pdf')).toBe('pdf')
    expect(tipoAnteprima('/api/media/file/foto.webp')).toBe('immagine')
    expect(tipoAnteprima('/api/media/file/foto', 'image/jpeg')).toBe('immagine')
    expect(tipoAnteprima('/api/media/file/modulo.docx')).toBeNull()
    expect(tipoAnteprima('https://example.org/bando.pdf')).toBeNull()
    expect(tipoAnteprima('//example.org/bando.pdf')).toBeNull()
  })

  it('attributi del link: anteprima con titolo e informazioni', () => {
    expect(
      attributiFile('/m/bando.pdf', { titolo: 'Bando', info: 'PDF · 1 MB', filename: 'b.pdf' }),
    ).toEqual({
      'aria-haspopup': 'dialog',
      'data-anteprima': 'pdf',
      'data-titolo': 'Bando',
      'data-file': 'b.pdf',
      'data-info': 'PDF · 1 MB',
    })
    expect(apreNuovaScheda('/m/bando.pdf')).toBe(false)
    expect(apreNuovaScheda('https://example.org/bando.pdf')).toBe(true)
  })

  it('zoom: passa al livello successivo o precedente', () => {
    expect(zoomVicino(1, 1)).toBe(1.25)
    expect(zoomVicino(1, -1)).toBe(0.9)
    expect(zoomVicino(1.1, 1)).toBe(1.25)
    expect(zoomVicino(4, 1)).toBe(4)
    expect(zoomVicino(0.25, -1)).toBe(0.25)
  })
})

describe('elenchi di file con anteprima', () => {
  it('Attachments: anteprima per PDF e immagini, Scarica accanto, axe pulito', async () => {
    const { container } = render(
      <Attachments
        items={[
          { nome: 'Bando', url: '/m/bando.pdf', mimeType: 'application/pdf', filesize: 2048 },
          { nome: 'Modulo', url: '/m/modulo.docx', filename: 'modulo.docx' },
        ]}
      />,
    )
    const bando = screen.getByRole('link', { name: /^Bando/ })
    expect(bando.getAttribute('data-anteprima')).toBe('pdf')
    expect(bando.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByRole('link', { name: 'Scarica Bando' }).hasAttribute('download')).toBe(true)
    // Gli altri file restano un download diretto, senza pulsante doppio
    expect(screen.getByRole('link', { name: /Modulo/ }).hasAttribute('download')).toBe(true)
    expect(screen.queryByRole('link', { name: 'Scarica Modulo' })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('ElencoDocumenti: link esterno in nuova scheda, file del sito in anteprima', async () => {
    const { container } = render(
      <ElencoDocumenti
        documenti={[
          { nome: 'Atto', url: '/uploads/atto.pdf' },
          { nome: 'Esterno', url: 'https://example.org/esterno.pdf' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: /^Atto/ }).getAttribute('data-anteprima')).toBe('pdf')
    const esterno = screen.getByRole('link', { name: /Esterno/ })
    expect(esterno.getAttribute('target')).toBe('_blank')
    expect(esterno.textContent).toContain('nuova scheda')
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('Visualizzatore', () => {
  function Pagina() {
    return (
      <>
        <ul data-anteprime="">
          <li>
            <a href="/m/uno.webp" {...attributiFile('/m/uno.webp', { titolo: 'Prima foto' })}>
              Prima foto
            </a>
          </li>
          <li>
            <a href="/m/due.webp" {...attributiFile('/m/due.webp', { titolo: 'Seconda foto' })}>
              Seconda foto
            </a>
          </li>
        </ul>
        <Visualizzatore />
      </>
    )
  }

  it('si apre al clic, scorre la raccolta, non ha violazioni axe e si chiude con Esc', async () => {
    render(<Pagina />)
    act(() => {
      fireEvent.click(screen.getByRole('link', { name: 'Prima foto' }))
    })
    const dialogo = await screen.findByRole('dialog')
    expect(screen.getByRole('heading', { name: 'Prima foto' })).toBeTruthy()
    expect(screen.getByText('1 di 2')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Scarica/ }).getAttribute('href')).toBe('/m/uno.webp')
    expect(await axeViolations(dialogo)).toEqual([])

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'File successivo' }))
    })
    expect(screen.getByRole('heading', { name: 'Seconda foto' })).toBeTruthy()

    act(() => {
      fireEvent.keyDown(dialogo, { key: 'Escape' })
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('Ctrl+clic lascia al browser il link (nuova scheda)', () => {
    render(<Pagina />)
    const link = screen.getByRole('link', { name: 'Prima foto' })
    act(() => {
      fireEvent.click(link, { ctrlKey: true })
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
