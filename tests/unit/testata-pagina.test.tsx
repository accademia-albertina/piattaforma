import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestataPagina } from '@/components'

import { axeViolations } from './axe'

describe('TestataPagina', () => {
  it('mostra occhiello, titolo e sommario senza violazioni axe', async () => {
    const { container } = render(
      <TestataPagina
        occhiello="Studente"
        titolo="Segreteria didattica"
        sommario="Orari e certificati."
      >
        <p>Dati</p>
      </TestataPagina>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Segreteria didattica' })).toBeTruthy()
    expect(screen.getByText('Studente')).toBeTruthy()
    expect(screen.getByText('Orari e certificati.')).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('senza occhiello non lascia paragrafi vuoti', () => {
    const { container } = render(<TestataPagina titolo="Avvisi" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })
})
