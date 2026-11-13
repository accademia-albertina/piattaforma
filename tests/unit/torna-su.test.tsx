import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TornaSu } from '@/components'

import { axeViolations } from './axe'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TornaSu', () => {
  it('compare dopo lo scorrimento e non ha violazioni axe', async () => {
    const { container } = render(<TornaSu soglia={100} />)
    const pulsante = screen.getByRole('button', { name: 'Torna all’inizio della pagina' })
    expect(pulsante.hasAttribute('data-visibile')).toBe(false)

    await act(async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
      fireEvent.scroll(window)
    })
    expect(pulsante.hasAttribute('data-visibile')).toBe(true)
    expect(await axeViolations(container)).toEqual([])
  })

  it('riporta all’inizio e mette il focus sul contenuto', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
    const main = document.createElement('main')
    main.id = 'contenuto'
    main.tabIndex = -1
    document.body.appendChild(main)

    render(<TornaSu soglia={-1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Torna all’inizio della pagina' }))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
    expect(document.activeElement).toBe(main)
    main.remove()
  })
})
