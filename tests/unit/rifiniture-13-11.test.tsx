import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { IntestazioneStampa, TornaSu } from '@/components'
import { CampoDocenti } from '@/components/admin/CampoDocenti'
import {
  filtraDocenti,
  nomeInScrittura,
  oraDaSelettore,
  oraPerSelettore,
  sostituisciNome,
} from '@/lib/calendari'
import { attributiFile, isPdf } from '@/utilities/pdf'

import { axeViolations } from './axe'

afterEach(cleanup)

const DOCENTI = [
  { id: 1, nome: 'Elisabetta', cognome: 'Ajani' },
  { id: 2, nome: 'Paolo', cognome: 'Rossi' },
  { id: 3, nome: 'Anna', cognome: 'Rossi' },
  { id: 4, nome: 'Luca', cognome: 'Ribero' },
  { id: 5, nome: 'Nicola', cognome: 'Àlvarez' },
]

describe('TornaSu e IntestazioneStampa', () => {
  it('TornaSu non ha violazioni axe', async () => {
    const { container } = render(<TornaSu sempreVisibile />)
    expect(screen.getByRole('button', { name: 'Torna su' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('TornaSu nascosto non è raggiungibile', () => {
    const { container } = render(<TornaSu />)
    // jsdom non applica "inert" all'albero di accessibilità: si verifica l'attributo
    expect(container.firstElementChild?.hasAttribute('inert')).toBe(true)
  })

  it('IntestazioneStampa non ha violazioni axe', async () => {
    const { container } = render(<IntestazioneStampa visibileASchermo />)
    expect(container.textContent).toContain('Accademia Albertina di Belle Arti di Torino')
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('PDF in nuova scheda', () => {
  it('riconosce i PDF da tipo o estensione', () => {
    expect(isPdf('/media/bando.pdf')).toBe(true)
    expect(isPdf('/media/bando.PDF?x=1')).toBe(true)
    expect(isPdf('/media/file', 'application/pdf')).toBe(true)
    expect(isPdf('/media/modulo.docx')).toBe(false)
    expect(attributiFile('/a.pdf', { scarica: true })).toEqual({
      target: '_blank',
      rel: 'noopener',
    })
    expect(attributiFile('/a.docx', { scarica: true })).toEqual({ download: true })
  })
})

describe('tabella calendari: ore e docenti', () => {
  it('converte le ore per il selettore e ritorno', () => {
    expect(oraPerSelettore('9:30')).toBe('09:30')
    expect(oraPerSelettore('9.30')).toBe('09:30')
    expect(oraPerSelettore('14')).toBe('14:00')
    expect(oraPerSelettore('25:00')).toBe('')
    expect(oraPerSelettore('mattina')).toBe('')
    expect(oraDaSelettore('09:30')).toBe('9:30')
    expect(oraDaSelettore('')).toBe('')
  })

  it('completa solo l’ultimo nome della cella', () => {
    expect(nomeInScrittura('Ajani, Ro')).toBe('Ro')
    expect(sostituisciNome('Ajani, Ro', 'Rossi Paolo')).toBe('Ajani, Rossi Paolo')
    expect(sostituisciNome('Rib', 'Ribero')).toBe('Ribero')
  })

  it('filtra per cognome o nome, senza accenti', () => {
    expect(filtraDocenti(DOCENTI, 'ro').map((d) => d.id)).toEqual([2, 3])
    expect(filtraDocenti(DOCENTI, 'alv').map((d) => d.id)).toEqual([5])
    expect(filtraDocenti(DOCENTI, 'luca').map((d) => d.id)).toEqual([4])
    expect(filtraDocenti(DOCENTI, '')).toEqual([])
  })

  function Prova({ formato }: { formato: 'cognome' | 'completo' }) {
    const [v, setV] = useState('')
    return (
      <CampoDocenti
        aria-label="Docenti, riga 1"
        value={v}
        onChange={setV}
        formato={formato}
        docenti={DOCENTI}
      />
    )
  }

  it('propone i docenti e inserisce il cognome (con il nome se è doppio)', async () => {
    const { container } = render(<Prova formato="cognome" />)
    const campo = screen.getByRole('combobox', { name: 'Docenti, riga 1' })
    fireEvent.change(campo, { target: { value: 'Rib' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(await axeViolations(container)).toEqual([])
    fireEvent.keyDown(campo, { key: 'Enter' })
    expect((campo as HTMLTextAreaElement).value).toBe('Ribero')

    fireEvent.change(campo, { target: { value: 'Ribero, ross' } })
    fireEvent.keyDown(campo, { key: 'ArrowDown' })
    fireEvent.keyDown(campo, { key: 'Enter' })
    expect((campo as HTMLTextAreaElement).value).toBe('Ribero, Rossi Anna')
  })

  it('Esc chiude i suggerimenti', () => {
    render(<Prova formato="completo" />)
    const campo = screen.getByRole('combobox')
    fireEvent.change(campo, { target: { value: 'aj' } })
    expect(campo.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(campo, { key: 'Escape' })
    expect(campo.getAttribute('aria-expanded')).toBe('false')
  })
})
