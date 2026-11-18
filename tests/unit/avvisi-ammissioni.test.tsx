import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AvvisiAmmissioni } from '@/components/AvvisiAmmissioni/AvvisiAmmissioni'
import { GRUPPI_ESEMPIO } from '@/components/AvvisiAmmissioni/esempio'
import { raggruppaPerScuola } from '@/lib/avvisi-ammissioni'

import { axeViolations } from './axe'

describe('Avvisi di ammissione', () => {
  it('una voce per scuola, che si apre ed è accessibile', async () => {
    const { container } = render(
      <section aria-labelledby="t">
        <h2 id="t">Avvisi dei coordinatori</h2>
        <AvvisiAmmissioni gruppi={GRUPPI_ESEMPIO} />
      </section>,
    )
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Cinema, Fotografia e Audiovisivo',
      'Pittura',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Cinema, Fotografia e Audiovisivo' }))
    expect(
      screen.getByRole('heading', { level: 4, name: 'Esiti della prova pratica' }),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { level: 5, name: 'Allegati' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('senza avvisi lo dice', () => {
    render(<AvvisiAmmissioni gruppi={[]} />)
    expect(screen.getByText('Al momento non ci sono avvisi dei coordinatori.')).toBeTruthy()
  })

  it('un avviso per più scuole compare sotto ciascuna, scuole in ordine di nome', () => {
    const gruppi = raggruppaPerScuola([
      {
        id: 1,
        titolo: 'Comune',
        pubblicatoIl: '2026-09-01T00:00:00.000Z',
        scuole: [
          { id: 2, nome: 'Scultura', slug: 'scultura' } as never,
          { id: 1, nome: 'Pittura', slug: 'pittura' } as never,
        ],
      },
    ])
    expect(gruppi.map((g) => [g.scuola.nome, g.avvisi.length])).toEqual([
      ['Pittura', 1],
      ['Scultura', 1],
    ])
  })
})
