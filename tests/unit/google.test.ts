import { describe, expect, it, vi } from 'vitest'

import {
  AccessoNegato,
  destinazioneSicura,
  profiloDaClaims,
  urlAutorizzazione,
} from '@/auth/google'

const claims = (extra: Record<string, unknown> = {}) => ({
  email: 'Mario.Rossi@albertina.academy',
  email_verified: true,
  hd: 'albertina.academy',
  given_name: 'Mario',
  family_name: 'Rossi',
  ...extra,
})

const motivo = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return e instanceof AccessoNegato ? e.motivo : 'altro'
  }
  return null
}

describe('Accesso con Google: controllo dell’account', () => {
  it('accetta un account dell’Accademia e normalizza l’email', () => {
    expect(profiloDaClaims(claims())).toEqual({
      email: 'mario.rossi@albertina.academy',
      nome: 'Mario',
      cognome: 'Rossi',
    })
    expect(profiloDaClaims(claims({ email: '12345t@albertina.academy' })).email).toBe(
      '12345t@albertina.academy',
    )
  })

  it('rifiuta account di altri domini, anche con hd falsificato', () => {
    expect(motivo(() => profiloDaClaims(claims({ hd: undefined, email: 'x@gmail.com' })))).toBe(
      'dominio',
    )
    expect(
      motivo(() => profiloDaClaims(claims({ hd: 'albertina.academy', email: 'x@gmail.com' }))),
    ).toBe('dominio')
    // Gmail personale con email aziendale come alias: senza hd non passa
    expect(motivo(() => profiloDaClaims(claims({ hd: undefined })))).toBe('dominio')
    expect(motivo(() => profiloDaClaims(claims({ hd: 'altro.it' })))).toBe('dominio')
  })

  it('rifiuta email non verificate', () => {
    expect(motivo(() => profiloDaClaims(claims({ email_verified: false })))).toBe('email')
    expect(motivo(() => profiloDaClaims(claims({ email_verified: 'true' })))).toBe('email')
  })

  it('accetta le caselle d’ufficio (resteranno in attesa di un ruolo)', () => {
    expect(profiloDaClaims(claims({ email: 'biblioteca@albertina.academy' })).email).toBe(
      'biblioteca@albertina.academy',
    )
  })
})

describe('Accesso con Google: indirizzi', () => {
  it('dopo l’accesso torna solo a percorsi interni', () => {
    expect(destinazioneSicura('/admin/collections/avvisi')).toBe('/admin/collections/avvisi')
    expect(destinazioneSicura('/')).toBe('/')
    for (const cattivo of [
      'https://evil.it',
      '//evil.it',
      '/\\evil.it',
      'admin',
      '/a\r\nb',
      7,
      null,
    ])
      expect(destinazioneSicura(cattivo)).toBe('/admin')
  })

  it('chiede a Google PKCE S256 e solo il dominio dell’Accademia', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'id-di-prova')
    const url = new URL(
      urlAutorizzazione({
        stato: 'stato',
        verificatore: 'verificatore',
        redirectUri: 'http://localhost:3000/api/users/google/callback',
      }),
    )
    vi.unstubAllEnvs()
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    const q = url.searchParams
    expect(q.get('client_id')).toBe('id-di-prova')
    expect(q.get('hd')).toBe('albertina.academy')
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('code_challenge')).toMatch(/^[\w-]{43}$/)
    expect(q.get('code_challenge')).not.toBe('verificatore')
    expect(q.get('state')).toBe('stato')
    expect(q.get('scope')).toBe('openid email profile')
  })
})
