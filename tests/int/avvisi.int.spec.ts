import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const ORA = new Date().toISOString()

async function utente(email: string, roles: User['roles']) {
  return payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })
}

describe('Avvisi: categorie per ruolo', () => {
  let redazione: User
  let segreteria: User
  let studente: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'avvisi', where: {} })
    await payload.delete({ collection: 'users', where: {} })
    await utente('admin.avvisi@albertina.academy', ['admin'])
    redazione = await utente('redazione.test@albertina.academy', ['redazione'])
    segreteria = await utente('segreteria.test@albertina.academy', ['segreteria'])
    studente = await utente('11111t@albertina.academy', ['studente'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'avvisi', where: {} })
    await payload.delete({ collection: 'users', where: {} })
  })

  it('la redazione pubblica negli Eventi e risulta autore', async () => {
    const avviso = await payload.create({
      collection: 'avvisi',
      data: {
        titolo: 'Inaugurazione mostra',
        pubblicatoIl: ORA,
        categorie: ['eventi'],
        _status: 'published',
      },
      user: redazione,
      overrideAccess: false,
      draft: false,
    })
    expect(avviso.categorie).toEqual(['eventi'])
    expect(typeof avviso.autore === 'object' ? avviso.autore?.id : avviso.autore).toBe(redazione.id)
  })

  it('la redazione non può pubblicare nelle Lezioni', async () => {
    const errore = await payload
      .create({
        collection: 'avvisi',
        data: { titolo: 'Lezione annullata', pubblicatoIl: ORA, categorie: ['lezioni'] },
        user: redazione,
        overrideAccess: false,
        draft: false,
      })
      .then(() => null)
      .catch((e: { data?: { errors?: { message: string }[] } }) => e)
    expect(JSON.stringify(errore?.data?.errors)).toContain('non può pubblicare in: Lezioni')
  })

  it('la segreteria non modifica un avviso In evidenza', async () => {
    const avviso = await payload.create({
      collection: 'avvisi',
      data: {
        titolo: 'Chiusura estiva',
        pubblicatoIl: ORA,
        categorie: ['in-evidenza', 'generali'],
        _status: 'published',
      },
      user: redazione,
      overrideAccess: false,
      draft: false,
    })
    await expect(
      payload.update({
        collection: 'avvisi',
        id: avviso.id,
        data: { titolo: 'Chiusura estiva modificata' },
        user: segreteria,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('uno studente non crea avvisi', async () => {
    await expect(
      payload.create({
        collection: 'avvisi',
        data: { titolo: 'Prova', pubblicatoIl: ORA, categorie: ['generali'] },
        user: studente,
        overrideAccess: false,
        draft: false,
      }),
    ).rejects.toThrow()
  })

  it('il pubblico vede solo gli avvisi pubblicati', async () => {
    await payload.create({
      collection: 'avvisi',
      data: { titolo: 'Bozza riservata', pubblicatoIl: ORA, categorie: ['tasse'] },
      user: segreteria,
      overrideAccess: false,
      draft: true,
    })
    const pubblici = await payload.find({ collection: 'avvisi', overrideAccess: false, limit: 100 })
    expect(pubblici.docs.map((a) => a.titolo)).not.toContain('Bozza riservata')
    expect(pubblici.docs.length).toBeGreaterThan(0)
  })

  it('titoli uguali ricevono indirizzi diversi', async () => {
    const dati = {
      titolo: 'Lezione sospesa',
      pubblicatoIl: ORA,
      categorie: ['lezioni' as const],
      _status: 'published' as const,
    }
    const opzioni = {
      collection: 'avvisi',
      data: dati,
      user: segreteria,
      overrideAccess: false,
      draft: false,
    } as const
    const a = await payload.create(opzioni)
    const b = await payload.create(opzioni)
    expect(a.slug).toBe('lezione-sospesa')
    expect(b.slug).toBe('lezione-sospesa-2')
  })
})
