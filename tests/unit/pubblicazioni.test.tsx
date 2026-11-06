import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: (p: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={p.href} className={p.className}>
      {p.children}
    </a>
  ),
}))

import { SchedaPubblicazione } from '@/components'
import { hrefCatalogo, parseFiltriCatalogo, prezzoEuro } from '@/lib/pubblicazioni'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Albertina Press', () => {
  it('legge i filtri del catalogo scartando i valori non validi', () => {
    expect(parseFiltriCatalogo({ collana: 'arcate', q: '  gipsoteca ', pagina: '2' })).toEqual({
      collana: 'arcate',
      q: 'gipsoteca',
      pagina: 2,
    })
    expect(parseFiltriCatalogo({ collana: 'inventata', pagina: '-3' })).toEqual({
      collana: undefined,
      q: undefined,
      pagina: 1,
    })
    expect(hrefCatalogo({ collana: 'visioni', pagina: 2 })).toBe(
      '/accademia/albertina-press?collana=visioni&pagina=2#catalogo',
    )
  })

  it('scrive il prezzo in euro', () => {
    expect(prezzoEuro(20).replace(/\s/g, ' ')).toBe('20,00 €')
  })

  it('la scheda ha copertina decorativa, titolo e invito, senza violazioni axe', async () => {
    const { container } = render(
      <ul>
        <li>
          <SchedaPubblicazione
            titolo="Polvere e luce"
            href="/accademia/albertina-press/polvere-e-luce"
            collana="Galleria"
            anno={2026}
            copertina={{ url: '/copertina.webp', width: 600, height: 840 }}
          />
        </li>
      </ul>,
    )
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/accademia/albertina-press/polvere-e-luce',
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Polvere e luce' })).toBeTruthy()
    expect(screen.getByText('Galleria · 2026')).toBeTruthy()
    expect(screen.getByText(/Vedi la scheda/)).toBeTruthy()
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(await axeViolations(container)).toEqual([])
  })
})
