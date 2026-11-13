import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CellaDocenti } from '@/components/admin/CellaDocenti'
import {
  filtraDocenti,
  nomeInScrittura,
  orarioDaSelettore,
  orarioPerSelettore,
} from '@/lib/calendari'

import { axeViolations } from './axe'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('helper orari e docenti', () => {
  it('converte gli orari per il selettore e ritorno', () => {
    expect(orarioPerSelettore('9:30')).toBe('09:30')
    expect(orarioPerSelettore('09.30')).toBe('09:30')
    expect(orarioPerSelettore('mattina')).toBeNull()
    expect(orarioDaSelettore('09:30')).toBe('9:30')
    expect(orarioDaSelettore('14:00')).toBe('14:00')
  })

  it('isola il nome che si sta scrivendo', () => {
    expect(nomeInScrittura('Rossi Mario, Bia')).toEqual({ prima: 'Rossi Mario, ', parziale: 'Bia' })
    expect(nomeInScrittura('Ros')).toEqual({ prima: '', parziale: 'Ros' })
  })

  it('filtra senza accenti sulle parti del nome', () => {
    const nomi = ['Bianchi Nicolò', 'Rossi Mario', 'Niccoli Anna']
    expect(filtraDocenti('nico', nomi)).toEqual(['Bianchi Nicolò'])
    expect(filtraDocenti('n', nomi)).toEqual([])
  })
})

describe('CellaDocenti', () => {
  it('propone i docenti e completa solo il nome in scrittura', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ docs: [{ cognome: 'Rossi', nome: 'Mario' }] }),
      })),
    )
    function Prova() {
      const [v, setV] = useState('')
      return <CellaDocenti value={v} onChange={setV} aria-label="Docenti" />
    }
    const { container } = render(<Prova />)
    const campo = screen.getByRole('combobox', { name: 'Docenti' })
    fireEvent.change(campo, { target: { value: 'Bianchi, ros' } })
    const opzione = await screen.findByRole('option', { name: 'Rossi Mario' })
    expect(await axeViolations(container)).toEqual([])
    fireEvent.mouseDown(opzione)
    expect((campo as HTMLInputElement).value).toBe('Bianchi, Rossi Mario')
  })
})
