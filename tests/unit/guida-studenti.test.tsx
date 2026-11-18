import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GuidaStudenti } from '@/components/GuidaStudenti/GuidaStudenti'
import { SchermataSito } from '@/components/SchermataSito/SchermataSito'
import { GUIDA_STUDENTI } from '@/content/guida-studenti'
import schermate from '@/content/guida-schermate.json'

import { axeViolations } from './axe'

describe('Guida per gli studenti', () => {
  it('ogni voce con una didascalia ha la sua schermata', () => {
    for (const v of GUIDA_STUDENTI.filter((v) => v.schermata))
      expect(Object.keys(schermate)).toContain(`studenti-${v.id}`)
  })

  it('la schermata descrive i riquadri numerati ed è accessibile', async () => {
    const { container } = render(
      <SchermataSito id="studenti-esami" didascalia="La pagina Esami e iscrizioni." />,
    )
    expect(screen.getByRole('img').getAttribute('alt')).toMatch(/passo 1, passo 2/)
    expect(await axeViolations(container)).toEqual([])
  })

  it('una schermata che non esiste non mostra nulla', () => {
    const { container } = render(<SchermataSito id="nessuna" didascalia="x" />)
    expect(container.innerHTML).toBe('')
  })

  it('la guida si apre voce per voce e resta accessibile', async () => {
    const { container } = render(<GuidaStudenti />)
    fireEvent.click(screen.getByRole('button', { name: 'Iscriversi a un corso' }))
    expect(screen.getByText(/riquadro “Iscrizione al corso” con le date/)).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })
})
