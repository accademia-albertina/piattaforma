import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IscrizioneCorso, MenuUtente, SchedaAppello } from '@/components'

import { axeViolations } from './axe'

// jsdom non ha CSS.escape, che il menu di React Aria usa
if (!globalThis.CSS?.escape) {
  globalThis.CSS = {
    ...globalThis.CSS,
    escape: (s: string) => s.replace(/[^\w-]/g, '\\$&'),
  } as typeof CSS
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const base = {
  idRiferimento: 7,
  stato: 'aperta' as const,
  apertura: '1 ottobre 2026, 09:00',
  chiusura: '31 ottobre 2026, 23:59',
}

describe('IscrizioneCorso', () => {
  it('non ha violazioni axe in nessuno stato', async () => {
    for (const props of [
      { ...base, utente: 'studente' as const },
      { ...base, utente: 'anonimo' as const },
      { ...base, utente: 'studente' as const, iscrizioneId: 3 },
      { ...base, stato: 'chiusa' as const, utente: 'studente' as const },
      { ...base, compatto: true, utente: 'studente' as const, iscrizioneId: 3 },
    ]) {
      const { container, unmount } = render(<IscrizioneCorso {...props} />)
      expect(await axeViolations(container)).toEqual([])
      unmount()
    }
  })

  it('chi non ha fatto l’accesso vede “Accedi per iscriverti”', () => {
    render(<IscrizioneCorso {...base} utente="anonimo" accessoHref="/accedi" />)
    expect(screen.getByRole('link', { name: 'Accedi per iscriverti' }).getAttribute('href')).toBe(
      '/accedi',
    )
  })

  it('a finestra chiusa non c’è nessun pulsante', () => {
    render(<IscrizioneCorso {...base} stato="chiusa" utente="studente" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/si sono chiuse il 31 ottobre/)).toBeTruthy()
  })

  it('iscrive e poi annulla con conferma', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ doc: { id: 42 } }), { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    render(<IscrizioneCorso {...base} utente="studente" />)

    fireEvent.click(screen.getByRole('button', { name: 'Iscriviti al corso' }))
    await screen.findByRole('button', { name: 'Annulla l’iscrizione' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/iscrizioni-corsi',
      expect.objectContaining({ method: 'POST' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Annulla l’iscrizione' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sì, annulla' }))
    await screen.findByRole('button', { name: 'Iscriviti al corso' })
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/iscrizioni-corsi/42',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('per gli esami usa l’endpoint degli appelli', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ doc: { id: 5 } }), { status: 201 }))
    render(<IscrizioneCorso {...base} tipo="esame" utente="studente" />)
    fireEvent.click(screen.getByRole('button', { name: 'Iscriviti all’appello' }))
    await screen.findByRole('button', { name: 'Annulla l’iscrizione' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/iscrizioni-esami',
      expect.objectContaining({ body: JSON.stringify({ appello: 7 }) }),
    )
  })

  it('SchedaAppello non ha violazioni axe', async () => {
    const { container } = render(
      <SchedaAppello
        titolo="Pittura"
        giorno="martedì 22 settembre 2026"
        ora="10:00"
        aula="C28"
        commissione="Rossi, Bianchi"
      />,
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('mostra il messaggio d’errore del server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errors: [{ message: 'Le iscrizioni a questo corso sono chiuse.' }] }),
        {
          status: 400,
        },
      ),
    )
    render(<IscrizioneCorso {...base} utente="studente" />)
    fireEvent.click(screen.getByRole('button', { name: 'Iscriviti al corso' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sono chiuse'))
  })
})

describe('MenuUtente', () => {
  it('senza accesso è il link “Accedi”', async () => {
    const { container } = render(<MenuUtente utente={null} />)
    expect(screen.getByRole('link', { name: 'Accedi' }).getAttribute('href')).toBe(
      '/area-riservata',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('lo studente vede iniziali e il menu con le iscrizioni', async () => {
    const { container } = render(
      <MenuUtente
        utente={{
          nome: 'Giulia',
          cognome: 'Bassi',
          email: '23456t@albertina.academy',
          roles: ['studente'],
        }}
      />,
    )
    expect(screen.getByText('GB')).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'La mia area, Giulia Bassi' }))
    const menu = await screen.findByRole('menu')
    expect(menu.textContent).toContain('Le mie iscrizioni')
    expect(menu.textContent).toContain('Guida per gli studenti')
    expect(menu.textContent).not.toContain('Pannello')
    expect(menu.textContent).toContain('Esci')
  })

  it('il personale ha il link al pannello', async () => {
    render(<MenuUtente utente={{ email: 'paola.verdi@albertina.academy', roles: ['docente'] }} />)
    fireEvent.click(screen.getByRole('button', { name: /La mia area/ }))
    expect((await screen.findByRole('menu')).textContent).toContain('Pannello')
  })
})
