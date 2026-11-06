import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PrimaDelLogin, { ERRORI_ACCESSO } from '@/components/admin/PrimaDelLogin'

import { axeViolations } from './axe'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

describe('Pagina di accesso al pannello', () => {
  it('senza credenziali Google mostra solo il modulo classico', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '')
    const { container } = render(<PrimaDelLogin />)
    expect(screen.queryByRole('link', { name: /Accedi con Google/ })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('con Google configurato offre il pulsante e spiega gli errori', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'segreto')
    const { container } = render(<PrimaDelLogin searchParams={{ errore: 'dominio' }} />)
    expect(screen.getByRole('link', { name: /Accedi con Google/ }).getAttribute('href')).toBe(
      '/api/users/google',
    )
    expect(screen.getByRole('alert').textContent).toBe(ERRORI_ACCESSO.dominio)
    // Il modulo con la password è nascosto, si apre solo dal link di emergenza
    expect(container.querySelector('.prima-del-login--solo-google')).not.toBeNull()
    expect(screen.getByRole('link', { name: /Accesso di emergenza/ }).getAttribute('href')).toBe(
      '/admin/login?password=1',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('dal link di emergenza mostra il modulo con la password', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'segreto')
    const { container } = render(<PrimaDelLogin searchParams={{ password: '1' }} />)
    expect(container.querySelector('.prima-del-login--solo-google')).toBeNull()
    expect(screen.queryByRole('link', { name: /Accesso di emergenza/ })).toBeNull()
  })

  it('ignora codici di errore sconosciuti', () => {
    render(<PrimaDelLogin searchParams={{ errore: 'toString' }} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
