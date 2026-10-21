import { describe, expect, it } from 'vitest'

import {
  canAccessBackend,
  classifyEmail,
  defaultRolesForEmail,
  hasRole,
  studentAccessExpiry,
} from '@/access/roles'

describe('classifyEmail', () => {
  it('riconosce studenti di triennio e biennio dalla matricola', () => {
    expect(classifyEmail('12345t@albertina.academy')).toEqual({
      kind: 'studente',
      corso: 'triennio',
      matricola: '12345',
    })
    expect(classifyEmail('678b@albertina.academy')).toEqual({
      kind: 'studente',
      corso: 'biennio',
      matricola: '678',
    })
  })

  it('riconosce il personale da nome.cognome', () => {
    expect(classifyEmail('mario.rossi@albertina.academy')).toEqual({ kind: 'personale' })
    expect(classifyEmail('Anna.De-Luca@Albertina.Academy')).toEqual({ kind: 'personale' })
  })

  it('rifiuta domini esterni e indirizzi non riconosciuti', () => {
    expect(classifyEmail('12345t@gmail.com')).toBeNull()
    expect(classifyEmail('mario.rossi@albertina.academy.evil.com')).toBeNull()
    expect(classifyEmail('segreteria@albertina.academy')).toBeNull()
    expect(classifyEmail('12345x@albertina.academy')).toBeNull()
    expect(classifyEmail('@albertina.academy')).toBeNull()
  })
})

describe('defaultRolesForEmail', () => {
  it('assegna "studente" solo agli studenti', () => {
    expect(defaultRolesForEmail('12345t@albertina.academy')).toEqual(['studente'])
    expect(defaultRolesForEmail('mario.rossi@albertina.academy')).toEqual([])
  })
})

describe('studentAccessExpiry', () => {
  const from = new Date('2026-11-01T00:00:00Z')

  it('dura 4 anni per il triennio e 3 per il biennio', () => {
    const triennio = classifyEmail('1t@albertina.academy')!
    const biennio = classifyEmail('1b@albertina.academy')!
    expect(studentAccessExpiry(triennio, from)?.getUTCFullYear()).toBe(2030)
    expect(studentAccessExpiry(biennio, from)?.getUTCFullYear()).toBe(2029)
  })

  it('non scade per il personale', () => {
    expect(studentAccessExpiry({ kind: 'personale' }, from)).toBeNull()
  })
})

describe('permessi', () => {
  it('hasRole gestisce utenti assenti o senza ruoli', () => {
    expect(hasRole(null, 'admin')).toBe(false)
    expect(hasRole({ roles: null }, 'admin')).toBe(false)
    expect(hasRole({ roles: ['docente'] }, 'admin', 'docente')).toBe(true)
  })

  it('studenti e dottorandi non entrano nel pannello', () => {
    expect(canAccessBackend({ roles: ['studente'] })).toBe(false)
    expect(canAccessBackend({ roles: ['dottorando'] })).toBe(false)
    expect(canAccessBackend({ roles: [] })).toBe(false)
    expect(canAccessBackend({ roles: ['segreteria'] })).toBe(true)
  })
})

describe('categorie degli avvisi', () => {
  it('ogni ruolo ha le sue categorie, l’admin tutte', async () => {
    const { categorieConsentite, CATEGORIE_AVVISI } = await import('@/access/avvisi')
    expect(categorieConsentite({ roles: ['admin'] })).toEqual([...CATEGORIE_AVVISI])
    expect(categorieConsentite({ roles: ['erasmus'] })).toEqual(['bandi-e-concorsi'])
    expect(categorieConsentite({ roles: ['studente'] })).toEqual([])
    expect(categorieConsentite({ roles: ['redazione', 'erasmus'] })).toEqual([
      'in-evidenza',
      'generali',
      'eventi',
      'bandi-e-concorsi',
    ])
  })
})
