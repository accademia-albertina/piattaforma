import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: (p: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={p.href} className={p.className}>
      {p.children}
    </a>
  ),
}))

import { SchedaDottorando } from '@/components'
import { numeroCiclo } from '@/utilities/ciclo'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Dottorandi', () => {
  it('converte il ciclo in numero per ordinare i gruppi', () => {
    expect(numeroCiclo('XL')).toBe(40)
    expect(numeroCiclo('XLI')).toBe(41)
    expect(numeroCiclo('XXXIX')).toBe(39)
    expect(numeroCiclo(null)).toBe(0)
  })

  it('la scheda ha nome, progetto e invito al profilo, senza violazioni axe', async () => {
    const { container } = render(
      <ul>
        <li>
          <SchedaDottorando
            nome="Paola Pietronave"
            href="/dottorati/albertina/dottorandi/paola-pietronave"
            dettaglio="New Media Art"
            progetto="Lumbung Italia"
            livello={2}
          />
        </li>
      </ul>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/dottorati/albertina/dottorandi/paola-pietronave')
    expect(screen.getByRole('heading', { level: 2, name: 'Paola Pietronave' })).toBeTruthy()
    expect(screen.getByText(/Leggi il profilo/)).toBeTruthy()
    // Senza foto mostra le iniziali, nascoste ai lettori di schermo
    expect(screen.getByText('PP').getAttribute('aria-hidden')).toBe('true')
    expect(await axeViolations(container)).toEqual([])
  })
})
