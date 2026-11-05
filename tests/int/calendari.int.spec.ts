import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Calendari: permessi', () => {
  const utenti: Record<string, User> = {}

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'calendari', where: {} })
    await payload.delete({ collection: 'users', where: { email: { like: 'cal.' } } })
    for (const [nome, ruolo] of [
      ['segreteria', 'segreteria'],
      ['vicedirezione', 'vicedirezione'],
      ['redazione', 'redazione'],
      ['docente', 'docente'],
    ] as const) {
      utenti[nome] = await payload.create({
        collection: 'users',
        data: { email: `cal.${nome}@albertina.academy`, password: PASSWORD, roles: [ruolo] },
      })
    }
  })

  afterAll(async () => {
    await payload.delete({ collection: 'calendari', where: {} })
  })

  const crea = (user: User, titolo: string) =>
    payload.create({
      collection: 'calendari',
      data: {
        tipo: 'lezioni',
        titolo,
        annoAccademico: '2026/2027',
        righe: [{ corso: 'Anatomia', livello: 'Triennio', extra: 'scartato' }, {}],
        _status: 'published',
      },
      user,
      overrideAccess: false,
    })

  it('segreteria e vicedirezione creano calendari; righe ripulite', async () => {
    const c = await crea(utenti.segreteria, 'Orario segreteria')
    expect(c.righe).toEqual([
      {
        corso: 'Anatomia',
        livello: 'Triennio',
        docenti: '',
        giorno: '',
        inizio: '',
        fine: '',
        semestre: '',
        aula: '',
      },
    ])
    expect(await rifiutato(crea(utenti.vicedirezione, 'Orario vice'))).toBe(false)
  })

  it('redazione e docenti non possono crearli né modificarli', async () => {
    expect(await rifiutato(crea(utenti.redazione, 'No'))).toBe(true)
    expect(await rifiutato(crea(utenti.docente, 'No'))).toBe(true)
    const { docs } = await payload.find({ collection: 'calendari', limit: 1 })
    expect(
      await rifiutato(
        payload.update({
          collection: 'calendari',
          id: docs[0].id,
          data: { titolo: 'Cambiato' },
          user: utenti.docente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('il pubblico vede solo i calendari pubblicati', async () => {
    await payload.create({
      collection: 'calendari',
      data: { tipo: 'esami', titolo: 'Bozza', annoAccademico: '2026/2027', righe: [] },
      draft: true,
      overrideAccess: true,
    })
    const { docs } = await payload.find({ collection: 'calendari', overrideAccess: false })
    expect(docs.every((d) => d._status === 'published')).toBe(true)
  })

  it('rifiuta un anno accademico scritto male', async () => {
    expect(
      await rifiutato(
        payload.create({
          collection: 'calendari',
          data: { tipo: 'lezioni', titolo: 'X', annoAccademico: '2026', righe: [] },
          overrideAccess: true,
        }),
      ),
    ).toBe(true)
  })
})
