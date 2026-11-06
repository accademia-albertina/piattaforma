import { createLocalReq, getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { annoConcluso } from '@/access/corsi'
import { endpointPulizia } from '@/lib/pulizia-iscrizioni'
import type { Corso, FinestraIscrizione, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const COLLEZIONI = [
  'iscrizioni-esami',
  'iscrizioni-corsi',
  'appelli',
  'finestre-iscrizione',
  'corsi',
  'docenti',
  'users',
] as const

describe('Pulizia delle iscrizioni di un anno concluso', () => {
  let segreteria: User
  let docente: User
  let studente: User
  let vecchio: Corso
  let attuale: Corso
  let finestraVecchia: FinestraIscrizione
  let finestraAttuale: FinestraIscrizione
  const email = vi.fn(async () => ({}))

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
    vi.spyOn(payload, 'sendEmail').mockImplementation(email)
    const utente = (e: string, roles: User['roles']) =>
      payload.create({ collection: 'users', data: { email: e, password: PASSWORD, roles } })
    segreteria = await utente('segreteria.pulizia@albertina.academy', ['segreteria'])
    docente = await utente('anna.neri@albertina.academy', ['docente'])
    const profilo = await payload.create({
      collection: 'docenti',
      data: { nome: 'Anna', cognome: 'Neri', account: docente.id },
    })
    studente = await utente('44444t@albertina.academy', ['studente'])
    const corso = (annoAccademico: string) =>
      payload.create({
        collection: 'corsi',
        draft: false,
        data: {
          titolo: `Disegno ${annoAccademico}`,
          livelli: ['triennio'],
          annoAccademico,
          docenti: [profilo.id],
          _status: 'published',
        },
      })
    vecchio = await corso('2024/2025')
    attuale = await corso('2026/2027')
    const finestra = (annoAccademico: string) =>
      payload.create({
        collection: 'finestre-iscrizione',
        data: {
          tipo: 'corsi',
          annoAccademico,
          periodo: 'primo',
          apertura: '2020-01-01T00:00:00.000Z',
          chiusura: '2099-01-01T00:00:00.000Z',
        } as FinestraIscrizione,
      })
    finestraVecchia = await finestra('2024/2025')
    finestraAttuale = await finestra('2026/2027')
    for (const c of [vecchio, attuale]) {
      await payload.create({
        collection: 'iscrizioni-corsi',
        data: { corso: c.id } as never,
        user: studente,
        overrideAccess: false,
        context: { senzaEmail: true },
      })
    }
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
  })

  const pulisci = async (user: User, finestra: FinestraIscrizione) => {
    const req = await createLocalReq({ user }, payload)
    Object.assign(req, { routeParams: { id: String(finestra.id) } })
    return (await endpointPulizia.handler(req)) as Response
  }

  it('riconosce gli anni conclusi', () => {
    const novembre2026 = new Date('2026-11-06T12:00:00Z')
    expect(annoConcluso('2025/2026', novembre2026)).toBe(true)
    expect(annoConcluso('2026/2027', novembre2026)).toBe(false)
  })

  it('solo gli uffici, e non sull’anno in corso', async () => {
    expect((await pulisci(docente, finestraVecchia)).status).toBe(403)
    expect((await pulisci(studente, finestraVecchia)).status).toBe(403)
    expect((await pulisci(segreteria, finestraAttuale)).status).toBe(400)
  })

  it('elimina solo le iscrizioni dell’anno concluso, senza email', async () => {
    const res = await pulisci(segreteria, finestraVecchia)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ eliminate: 1, errori: 0 })
    const { docs } = await payload.find({ collection: 'iscrizioni-corsi', depth: 0 })
    expect(docs.map((d) => d.corso)).toEqual([attuale.id])
    await new Promise((r) => setTimeout(r, 100))
    expect(email).not.toHaveBeenCalled()
  })
})
