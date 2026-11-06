import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { idYoutube } from '@/collections/Scuole'
import { SchedePercorso, VideoYoutube } from '@/components'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Pagina della scuola', () => {
  it('riconosce i link YouTube e scarta il resto', () => {
    expect(idYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(idYoutube('https://youtu.be/dQw4w9WgXcQ?t=3')).toBe('dQw4w9WgXcQ')
    expect(idYoutube('https://vimeo.com/123')).toBeNull()
    expect(idYoutube(null)).toBeNull()
  })

  it('le schede dei percorsi funzionano da tastiera, senza violazioni axe', async () => {
    const { container } = render(
      <SchedePercorso
        label="Percorsi della scuola"
        percorsi={[
          { id: 'triennio', label: 'Triennio', contenuto: <p>Primo livello</p> },
          { id: 'biennio', label: 'Biennio specialistico', contenuto: <p>Secondo livello</p> },
        ]}
      />,
    )
    const schede = screen.getAllByRole('tab')
    expect(schede.map((t) => t.textContent)).toEqual(['Triennio', 'Biennio specialistico'])
    expect(screen.getByRole('tabpanel').textContent).toBe('Primo livello')
    expect(await axeViolations(container)).toEqual([])
  })

  it('con un solo percorso non mostra schede', () => {
    render(
      <SchedePercorso
        label="Percorsi"
        percorsi={[{ id: 'triennio', label: 'Triennio', contenuto: <p>Solo triennio</p> }]}
      />,
    )
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByText('Solo triennio')).toBeTruthy()
  })

  it('il video si carica da youtube-nocookie solo dopo il clic', async () => {
    const { container } = render(<VideoYoutube id="dQw4w9WgXcQ" titolo="La Scuola di Pittura" />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(await axeViolations(container)).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: /Guarda il video/ }))
    const iframe = container.querySelector('iframe')!
    expect(iframe.getAttribute('src')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/)
    expect(iframe.getAttribute('title')).toBe('La Scuola di Pittura')
  })
})
