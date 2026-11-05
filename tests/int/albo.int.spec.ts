import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Albo online e trasparenza: permessi', () => {
  const utenti: Record<string, User> = {}

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'albo', where: {} })
    await payload.delete({ collection: 'trasparenza', where: {} })
    await payload.delete({ collection: 'users', where: { email: { like: 'albo.' } } })
    for (const ruolo of [
      'amministrativo',
      'segreteria',
      'vicedirezione',
      'redazione',
      'docente',
    ] as const) {
      utenti[ruolo] = await payload.create({
        collection: 'users',
        data: { email: `albo.${ruolo}@albertina.academy`, password: PASSWORD, roles: [ruolo] },
      })
    }
  })

  afterAll(async () => {
    await payload.delete({ collection: 'albo', where: {} })
    await payload.delete({ collection: 'trasparenza', where: {} })
  })

  const atto = (user: User, titolo: string) =>
    payload.create({
      collection: 'albo',
      data: {
        titolo,
        sezione: 'bandi-generici',
        categoria: 'Bandi per studenti',
        pubblicatoIl: new Date().toISOString(),
        documenti: [{ nome: 'Bando', url: 'https://example.org/bando.pdf' }],
        _status: 'published',
      },
      user,
      overrideAccess: false,
    })

  const sottosezione = (user: User, titolo: string) =>
    payload.create({
      collection: 'trasparenza',
      data: { titolo, sezione: 'Bilanci', testo: 'Testo', _status: 'published' },
      user,
      overrideAccess: false,
    })

  it('amministrativo, segreteria e vicedirezione pubblicano nell’Albo', async () => {
    expect(await rifiutato(atto(utenti.amministrativo, 'Bando amministrativo'))).toBe(false)
    expect(await rifiutato(atto(utenti.segreteria, 'Bando segreteria'))).toBe(false)
    expect(await rifiutato(atto(utenti.vicedirezione, 'Bando vicedirezione'))).toBe(false)
  })

  it('redazione e docenti non toccano l’Albo', async () => {
    expect(await rifiutato(atto(utenti.redazione, 'No'))).toBe(true)
    expect(await rifiutato(atto(utenti.docente, 'No'))).toBe(true)
    const { docs } = await payload.find({ collection: 'albo', limit: 1 })
    expect(
      await rifiutato(
        payload.update({
          collection: 'albo',
          id: docs[0].id,
          data: { titolo: 'Cambiato' },
          user: utenti.redazione,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('un documento senza file né link è rifiutato', async () => {
    expect(
      await rifiutato(
        payload.create({
          collection: 'albo',
          data: {
            titolo: 'Senza documento',
            sezione: 'sindacale',
            categoria: 'Scioperi',
            pubblicatoIl: new Date().toISOString(),
            documenti: [{ nome: 'Vuoto' }],
          },
          overrideAccess: true,
        }),
      ),
    ).toBe(true)
  })

  it('la trasparenza la aggiornano solo amministrativo e vicedirezione', async () => {
    expect(await rifiutato(sottosezione(utenti.amministrativo, 'Bilancio preventivo'))).toBe(false)
    expect(await rifiutato(sottosezione(utenti.vicedirezione, 'Bilancio consuntivo'))).toBe(false)
    expect(await rifiutato(sottosezione(utenti.segreteria, 'No'))).toBe(true)
    expect(await rifiutato(sottosezione(utenti.redazione, 'No'))).toBe(true)
  })

  it('la data di aggiornamento cambia da sola, tranne nell’importazione', async () => {
    const vecchia = '2020-01-01T00:00:00.000Z'
    const importata = await payload.create({
      collection: 'trasparenza',
      data: {
        titolo: 'Importata',
        sezione: 'Personale',
        aggiornatoIl: vecchia,
        _status: 'published',
      },
      context: { importazione: true },
    })
    expect(importata.aggiornatoIl).toBe(vecchia)
    const modificata = await payload.update({
      collection: 'trasparenza',
      id: importata.id,
      data: { testo: 'Nuovo testo' },
    })
    expect(modificata.aggiornatoIl).not.toBe(vecchia)
  })

  it('il pubblico vede solo atti e sottosezioni pubblicati', async () => {
    await payload.create({
      collection: 'albo',
      data: {
        titolo: 'Bozza',
        sezione: 'bandi-di-gara',
        categoria: 'Servizi',
        pubblicatoIl: new Date().toISOString(),
      },
      draft: true,
    })
    await payload.create({
      collection: 'trasparenza',
      data: { titolo: 'Bozza', sezione: 'Bilanci' },
      draft: true,
    })
    const albo = await payload.find({ collection: 'albo', overrideAccess: false })
    const trasp = await payload.find({ collection: 'trasparenza', overrideAccess: false })
    expect(albo.docs.length).toBeGreaterThan(0)
    expect(albo.docs.every((d) => d._status === 'published')).toBe(true)
    expect(trasp.docs.every((d) => d._status === 'published')).toBe(true)
  })
})
