import { createLocalReq, formatErrors, getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { erroreUtente } from '@/lib/errori'
import { cella, endpointExport } from '@/lib/export-iscritti'
import { messaggioEsame } from '@/lib/email-iscrizioni'
import type { Appello, Corso, FinestraIscrizione, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const GIORNO = 24 * 60 * 60 * 1000
const fra = (giorni: number) => new Date(Date.now() + giorni * GIORNO).toISOString()

const COLLEZIONI = [
  'iscrizioni-esami',
  'iscrizioni-corsi',
  'appelli',
  'finestre-iscrizione',
  'corsi',
  'docenti',
  'users',
] as const

const utente = (email: string, roles: User['roles'], extra: Partial<User> = {}) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles, ...extra } })

describe('Email di conferma ed export degli iscritti', () => {
  let segreteria: User
  let docente: User
  let altroDocente: User
  let studente: User
  let corso: Corso
  let corsoAltro: Corso
  let appello: Appello
  const spedite: { to: string; subject: string; text: string }[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
    vi.spyOn(payload, 'sendEmail').mockImplementation(async (m) => {
      spedite.push(m as (typeof spedite)[number])
      return {}
    })
    segreteria = await utente('segreteria.export@albertina.academy', ['segreteria'])
    docente = await utente('marta.rossi@albertina.academy', ['docente'])
    altroDocente = await utente('luca.verdi@albertina.academy', ['docente'])
    studente = await utente('33333t@albertina.academy', ['studente'], {
      nome: 'Giulia',
      cognome: 'Ferraris',
    })
    const profilo = await payload.create({
      collection: 'docenti',
      data: { nome: 'Marta', cognome: 'Rossi', account: docente.id },
    })
    const profiloAltro = await payload.create({
      collection: 'docenti',
      data: { nome: 'Luca', cognome: 'Verdi', account: altroDocente.id },
    })
    const crea = (titolo: string, docenteId: number) =>
      payload.create({
        collection: 'corsi',
        draft: false,
        data: {
          titolo,
          livelli: ['triennio', 'biennio'],
          annoAccademico: '2026/2027',
          docenti: [docenteId],
          _status: 'published',
        },
      })
    corso = await crea('Anatomia artistica', profilo.id)
    corsoAltro = await crea('Tecniche dell’incisione', profiloAltro.id)
    for (const tipo of ['corsi', 'esami'] as const) {
      await payload.create({
        collection: 'finestre-iscrizione',
        data: {
          tipo,
          annoAccademico: '2026/2027',
          periodo: tipo === 'corsi' ? 'primo' : 'invernale',
          apertura: fra(-1),
          chiusura: fra(20),
        } as FinestraIscrizione,
      })
    }
    appello = await payload.create({
      collection: 'appelli',
      data: {
        corso: corso.id,
        annoAccademico: '2026/2027',
        sessione: 'invernale',
        data: fra(14),
        ora: '10:00',
        aula: 'C28',
      } as Appello,
    })
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
  })

  const ultimaPer = async (to: string) => {
    await vi.waitFor(() => expect(spedite.some((m) => m.to === to)).toBe(true))
    return spedite.filter((m) => m.to === to).at(-1)!
  }

  it('manda la conferma quando lo studente si iscrive e quando annulla', async () => {
    spedite.length = 0
    const iscrizione = await payload.create({
      collection: 'iscrizioni-corsi',
      data: { corso: corso.id } as never,
      user: studente,
      overrideAccess: false,
    })
    const conferma = await ultimaPer(studente.email)
    expect(conferma.subject).toBe('Iscrizione al corso Anatomia artistica')
    expect(conferma.text).toContain('Gentile Ferraris Giulia')
    expect(conferma.text).toContain('Puoi annullare l’iscrizione')

    spedite.length = 0
    await payload.delete({
      collection: 'iscrizioni-corsi',
      id: iscrizione.id,
      user: studente,
      overrideAccess: false,
    })
    expect((await ultimaPer(studente.email)).subject).toBe(
      'Iscrizione annullata: Anatomia artistica',
    )
  })

  it('manda la conferma dell’esame con data e aula; niente email con senzaEmail', async () => {
    spedite.length = 0
    await payload.create({
      collection: 'iscrizioni-esami',
      data: { appello: appello.id } as never,
      user: studente,
      overrideAccess: false,
    })
    const conferma = await ultimaPer(studente.email)
    expect(conferma.subject).toBe('Iscrizione all’esame di Anatomia artistica')
    expect(conferma.text).toContain('Aula: C28')
    expect(conferma.text).toContain('ore 10:00')

    spedite.length = 0
    await payload.delete({
      collection: 'iscrizioni-esami',
      where: { studente: { equals: studente.id } },
      context: { senzaEmail: true },
    })
    await new Promise((r) => setTimeout(r, 100))
    expect(spedite).toHaveLength(0)
  })

  it('non prepara email senza indirizzo', () => {
    expect(
      messaggioEsame(
        { email: null, nominativo: 'X' },
        { titolo: 'x', data: fra(3), ora: '9:00', aula: null },
        null,
        'iscrizione',
      ),
    ).toBeNull()
  })

  const scarica = async (user: User, query: string, collezione = 'iscrizioni-corsi') => {
    const req = await createLocalReq({ user }, payload)
    Object.assign(req, { url: `http://localhost/api/${collezione}/export?${query}` })
    const ep =
      collezione === 'iscrizioni-corsi'
        ? endpointExport('iscrizioni-corsi', 'corso')
        : endpointExport('iscrizioni-esami', 'appello')
    return (await ep.handler(req)) as Response
  }

  it('il docente scarica in CSV solo gli iscritti dei suoi corsi', async () => {
    await payload.create({
      collection: 'iscrizioni-corsi',
      data: { corso: corso.id } as never,
      user: studente,
      overrideAccess: false,
      context: { senzaEmail: true },
    })
    const res = await scarica(docente, `corso=${corso.id}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toContain('iscritti-anatomia-artistica.csv')
    const byte = new Uint8Array(await res.clone().arrayBuffer())
    expect([...byte.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]) // BOM per Excel
    const csv = (await res.text()).replace(/^\uFEFF/, '')
    expect(csv.startsWith('Cognome e nome;Matricola;Livello;Email;Corso;Iscritto il')).toBe(true)
    expect(csv).toContain(
      'Ferraris Giulia;33333;Triennio;33333t@albertina.academy;Anatomia artistica;',
    )

    // Corso di un altro docente: elenco vuoto
    const altro = await (await scarica(docente, `corso=${corsoAltro.id}`)).text()
    expect(altro.trim().split('\r\n')).toHaveLength(1)
  })

  it('studenti esclusi; l’anno intero solo agli uffici', async () => {
    expect((await scarica(studente, `corso=${corso.id}`)).status).toBe(403)
    expect((await scarica(docente, 'anno=2026/2027')).status).toBe(400)
    const tutto = await (await scarica(segreteria, 'anno=2026/2027')).text()
    expect(tutto).toContain('Ferraris Giulia')
    expect((await scarica(segreteria, 'anno=2026/2027', 'iscrizioni-esami')).status).toBe(200)
  })

  it('neutralizza le formule nelle celle', () => {
    expect(cella('=SOMMA(A1)')).toBe("'=SOMMA(A1)")
    expect(cella('Rossi; Maria')).toBe('"Rossi; Maria"')
  })

  it('il messaggio d’errore arriva allo studente anche con i nomi minificati', () => {
    const err = erroreUtente('Le iscrizioni a questo corso sono chiuse.')
    Object.defineProperty(err, 'name', { value: '' }) // come nella build di produzione
    expect(formatErrors(err).errors[0].message).toBe('Le iscrizioni a questo corso sono chiuse.')
  })
})
