import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DisdettaSportello, PrenotazioneSportello } from '@/components'
import {
  chiusuraDelTurno,
  festivita,
  giorniDiApertura,
  giornoRoma,
  istanteRoma,
  oraRoma,
  turniDelGiorno,
} from '@/lib/sportello-orari'

import { axeViolations } from './axe'

afterEach(cleanup)

const AMELIA = {
  durataTurno: 5,
  personePerTurno: 1,
  giorniPrenotabili: 60,
  orari: [
    { giorno: '1', dalle: '10:00', alle: '12:00' },
    { giorno: '5', dalle: '10:00', alle: '12:00' },
  ],
}

describe('Orari dello sportello', () => {
  it('lunedì e venerdì 10-12 a turni di 5 minuti: 24 turni', () => {
    const turni = turniDelGiorno('2026-11-20', AMELIA)
    expect(turni).toHaveLength(24)
    expect(turni[0]).toBe('10:00')
    expect(turni.at(-1)).toBe('11:55')
    expect(turniDelGiorno('2026-11-18', AMELIA)).toEqual([]) // mercoledì
  })

  it('converte l’ora di Roma con ora solare e legale', () => {
    expect(istanteRoma('2026-11-20', '10:00').toISOString()).toBe('2026-11-20T09:00:00.000Z')
    expect(istanteRoma('2027-06-28', '10:00').toISOString()).toBe('2027-06-28T08:00:00.000Z')
    const d = new Date('2027-03-29T08:05:00.000Z')
    expect([giornoRoma(d), oraRoma(d)]).toEqual(['2027-03-29', '10:05'])
  })

  it('esclude festività, chiusure intere e chiusure di qualche ora', () => {
    expect(festivita('2026-12-25')).toBe('Natale')
    expect(festivita('2027-03-29')).toBe('Lunedì dell’Angelo')
    expect(turniDelGiorno('2026-12-25', AMELIA)).toEqual([])
    const chiusure = [
      { dal: '2026-11-23T12:00:00.000Z', motivo: 'Sciopero' },
      { dal: '2026-11-27T12:00:00.000Z', dalle: '11:00', alle: '12:00', motivo: 'Riunione' },
    ]
    const imp = { ...AMELIA, chiusure }
    expect(turniDelGiorno('2026-11-23', imp)).toEqual([])
    expect(turniDelGiorno('2026-11-27', imp)).toHaveLength(12)
    expect(chiusuraDelTurno('2026-11-27', '10:55', 5, chiusure)).toBeNull()
    expect(chiusuraDelTurno('2026-11-27', '11:00', 5, chiusure)?.motivo).toBe('Riunione')
  })

  it('si prenota al massimo 60 giorni avanti, più le aperture in più', () => {
    const giorni = giorniDiApertura('2026-11-18', AMELIA)
    expect(giorni[0]).toBe('2026-11-20')
    expect(giorni.at(-1)! <= '2027-01-17').toBe(true)
    const conApertura = giorniDiApertura('2026-11-18', {
      ...AMELIA,
      aperture: [{ data: '2026-11-25T12:00:00.000Z', dalle: '14:00', alle: '15:00' }],
    })
    expect(conApertura).toContain('2026-11-25')
  })

  it('con 2 giorni di preavviso il primo giorno utile è dopodomani', () => {
    // Giovedì 19: venerdì 20 è troppo vicino, il primo è lunedì 23
    expect(giorniDiApertura('2026-11-19', { ...AMELIA, giorniPreavviso: 2 })[0]).toBe('2026-11-23')
    // Mercoledì 18: venerdì 20 è proprio a due giorni, va bene
    expect(giorniDiApertura('2026-11-18', { ...AMELIA, giorniPreavviso: 2 })[0]).toBe('2026-11-20')
  })
})

const giorni = [
  {
    data: '2026-11-20',
    liberi: 1,
    turni: [
      { ora: '10:00', inizio: '2026-11-20T09:00:00.000Z', liberi: 0 },
      { ora: '10:05', inizio: '2026-11-20T09:05:00.000Z', liberi: 1 },
    ],
  },
  {
    data: '2026-11-23',
    liberi: 0,
    turni: [{ ora: '10:00', inizio: '2026-11-23T09:00:00.000Z', liberi: 0 }],
  },
]
const documenti = [
  { id: 'a', nome: 'Libretto' },
  { id: 'b', nome: 'Pergamena di laurea' },
]

describe('PrenotazioneSportello', () => {
  it('senza account: accesso con Google oppure dati e codice, senza violazioni axe', async () => {
    const { container } = render(
      <PrenotazioneSportello
        utente={{ tipo: 'anonimo' }}
        accessoHref="/admin/login?redirect=%2Fprenotazioni-segreteria"
        attivo
        documenti={documenti}
        giorni={giorni}
      />,
    )
    expect(screen.getByRole('link', { name: 'Accedi con Google' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /Email/ })).toBeTruthy()
    // Giorno completo non selezionabile
    expect(
      (screen.getByRole('radio', { name: /23 novembre, completo/ }) as HTMLInputElement).disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: 'Libretto' }))
    fireEvent.click(screen.getByRole('radio', { name: /20 novembre/ }))
    expect(
      (screen.getByRole('radio', { name: '10:00, occupato' }) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(await axeViolations(container)).toEqual([])
  })

  it('con account: niente dati da compilare e i propri appuntamenti con Disdici', async () => {
    const { container } = render(
      <PrenotazioneSportello
        utente={{ tipo: 'account', nominativo: 'Giulia Bianchi', dettaglio: 'matricola 12345' }}
        accessoHref="/admin/login"
        attivo
        documenti={documenti}
        giorni={giorni}
        appuntamenti={[{ id: 3, documento: 'Libretto', inizio: '2026-11-20T09:05:00.000Z' }]}
      />,
    )
    expect(screen.queryByRole('textbox', { name: /Email/ })).toBeNull()
    expect(screen.getByText(/venerdì 20 novembre, ore 10:05/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Disdici' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('prenotazioni sospese', async () => {
    const { container } = render(
      <PrenotazioneSportello
        utente={{ tipo: 'anonimo' }}
        accessoHref="/"
        attivo={false}
        documenti={documenti}
        giorni={[]}
      />,
    )
    expect(screen.getByText('Prenotazioni sospese')).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('DisdettaSportello senza violazioni axe', async () => {
    const { container } = render(
      <DisdettaSportello
        id={1}
        token="x"
        documento="Libretto"
        quando="venerdì 20 novembre, ore 10:05"
      />,
    )
    expect(screen.getByRole('button', { name: 'Sì, disdici' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })
})
