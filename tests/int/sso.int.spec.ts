// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { abbinaDocente, inAttesa, trovaOCreaUtente } from '@/auth/endpoints'
import { apriSessione } from '@/auth/sessione'
import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const DOCENTE = 'anna.sso-prova@albertina.academy'

describe('Accesso con Google: account e ruoli', () => {
  let admin: User

  const pulisci = async () => {
    await payload.delete({ collection: 'docenti', where: { email: { like: 'sso-prova' } } })
    await payload.delete({ collection: 'users', where: { email: { like: 'sso-prova' } } })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
    admin = await payload.create({
      collection: 'users',
      data: { email: 'admin.sso-prova@albertina.academy', password: PASSWORD, roles: ['admin'] },
    })
    await payload.create({
      collection: 'docenti',
      data: { nome: 'Anna', cognome: 'Prova', email: DOCENTE, attivo: true },
    })
  })

  afterAll(pulisci)

  it('uno studente entra con il ruolo Studente', async () => {
    const u = await trovaOCreaUtente(payload, { email: '77777t@albertina.academy', nome: 'Ugo' })
    expect(u.roles).toEqual(['studente'])
    expect(inAttesa(u)).toBe(false)
    await payload.delete({ collection: 'users', id: u.id })
  })

  it('un docente in elenco diventa Docente ed è collegato al profilo', async () => {
    const u = await trovaOCreaUtente(payload, { email: DOCENTE, nome: 'Anna', cognome: 'Prova' })
    expect(u.roles).toEqual(['docente'])
    const { docs } = await payload.find({
      collection: 'docenti',
      where: { email: { equals: DOCENTE } },
      depth: 0,
      overrideAccess: true,
    })
    expect(docs[0].account).toBe(u.id)
  })

  it('il personale non in elenco resta in attesa e compare tra i “da abilitare”', async () => {
    const u = await trovaOCreaUtente(payload, {
      email: 'segreteria.sso-prova@albertina.academy',
      nome: 'Sara',
    })
    expect(u.roles ?? []).toEqual([])
    expect(inAttesa(u)).toBe(true)

    const { docs } = await payload.find({
      collection: 'users',
      user: admin,
      overrideAccess: false,
      where: { and: [{ roles: { exists: false } }, { email: { like: 'sso-prova' } }] },
      depth: 0,
    })
    expect(docs.map((d) => d.email)).toEqual(['segreteria.sso-prova@albertina.academy'])
  })

  it('non sovrascrive nome e ruoli già impostati nel pannello', async () => {
    const u = await payload.create({
      collection: 'users',
      data: {
        email: 'redazione.sso-prova@albertina.academy',
        password: PASSWORD,
        nome: 'Nome giusto',
        roles: ['redazione'],
      },
    })
    const dopo = await trovaOCreaUtente(payload, {
      email: u.email,
      nome: 'Altro',
      cognome: 'Cognome',
    })
    expect(dopo.id).toBe(u.id)
    expect(dopo.nome).toBe('Nome giusto')
    expect(dopo.cognome).toBe('Cognome')
    expect(dopo.roles).toEqual(['redazione'])
  })

  it('un docente non più in servizio non riceve il ruolo in automatico', async () => {
    await payload.create({
      collection: 'docenti',
      data: {
        nome: 'Piero',
        cognome: 'Prova',
        email: 'piero.sso-prova@albertina.academy',
        attivo: false,
      },
    })
    const u = await trovaOCreaUtente(payload, { email: 'piero.sso-prova@albertina.academy' })
    expect(inAttesa(u)).toBe(true)
    // Un admin che poi assegna il ruolo a mano non viene toccato dai successivi accessi
    await payload.update({ collection: 'users', id: u.id, data: { roles: ['segreteria'] } })
    const dopo = await abbinaDocente(payload, { ...u, roles: ['segreteria'] })
    expect(dopo.roles).toEqual(['segreteria'])
  })

  it('la sessione aperta da Google è valida per Payload', async () => {
    const u = (
      await payload.find({ collection: 'users', where: { email: { equals: DOCENTE } }, depth: 0 })
    ).docs[0]
    const cookie = await apriSessione(payload, u)
    const coppia = cookie.split(';')[0]
    expect(cookie).toMatch(/HttpOnly/i)
    const { user } = await payload.auth({ headers: new Headers({ cookie: coppia }) })
    expect(user?.email).toBe(DOCENTE)
    expect((user as User).roles).toEqual(['docente'])
  })

  it('con Google attivo la password vale solo per gli amministratori', async () => {
    const redazione = await payload.create({
      collection: 'users',
      data: { email: 'pw.sso-prova@albertina.academy', password: PASSWORD, roles: ['redazione'] },
    })
    vi.stubEnv('GOOGLE_CLIENT_ID', 'id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'segreto')
    try {
      await expect(
        payload.login({
          collection: 'users',
          data: { email: redazione.email, password: PASSWORD },
        }),
      ).rejects.toThrow(/Accedi con Google/)
      const ok = await payload.login({
        collection: 'users',
        data: { email: admin.email, password: PASSWORD },
      })
      expect(ok.token).toBeTruthy()
    } finally {
      vi.unstubAllEnvs()
    }
    // Senza Google configurato (sviluppo, anteprima di oggi) la password funziona per tutti
    const senza = await payload.login({
      collection: 'users',
      data: { email: redazione.email, password: PASSWORD },
    })
    expect(senza.token).toBeTruthy()
  })
})
