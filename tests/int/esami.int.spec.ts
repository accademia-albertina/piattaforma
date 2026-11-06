import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Appello, Corso, FinestraIscrizione, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const GIORNO = 24 * 60 * 60 * 1000
const fra = (giorni: number) => new Date(Date.now() + giorni * GIORNO).toISOString()

const utente = (email: string, roles: User['roles']) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

const COLLEZIONI = [
  'iscrizioni-esami',
  'iscrizioni-corsi',
  'appelli',
  'finestre-iscrizione',
  'corsi',
  'docenti',
  'users',
] as const

describe('Appelli e iscrizioni agli esami', () => {
  let segreteria: User
  let docente: User
  let altroDocente: User
  let studenteT: User
  let studenteB: User
  let corso: Corso
  let corsoAltro: Corso
  let appelloT: Appello
  let appelloB: Appello
  let appelloT2: Appello
  let finestra: FinestraIscrizione

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
    await utente('admin.esami@albertina.academy', ['admin'])
    segreteria = await utente('segreteria.esami@albertina.academy', ['segreteria'])
    docente = await utente('francesca.bernardelli@albertina.academy', ['docente'])
    altroDocente = await utente('aldo.bianchi@albertina.academy', ['docente'])
    studenteT = await utente('11111t@albertina.academy', ['studente'])
    studenteB = await utente('22222b@albertina.academy', ['studente'])

    const profilo = await payload.create({
      collection: 'docenti',
      data: { nome: 'Francesca', cognome: 'Bernardelli', account: docente.id },
    })
    const profiloAltro = await payload.create({
      collection: 'docenti',
      data: { nome: 'Aldo', cognome: 'Bianchi', account: altroDocente.id },
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
    corso = await crea('Storia dell’arte contemporanea', profilo.id)
    corsoAltro = await crea('Fenomenologia delle arti', profiloAltro.id)

    finestra = await payload.create({
      collection: 'finestre-iscrizione',
      data: {
        tipo: 'esami',
        annoAccademico: '2026/2027',
        periodo: 'invernale',
        apertura: fra(-1),
        chiusura: fra(20),
      } as FinestraIscrizione,
      user: segreteria,
      overrideAccess: false,
    })

    const appello = (data: Partial<Appello>, user: User) =>
      payload.create({
        collection: 'appelli',
        data: {
          corso: corso.id,
          annoAccademico: '2026/2027',
          sessione: 'invernale',
          ora: '10:00',
          aula: 'C28',
          commissione: 'Bernardelli, Bertolino, Ajani',
          ...data,
        } as Appello,
        user,
        overrideAccess: false,
      })
    appelloB = await appello({ data: fra(10), livelli: ['biennio'] }, segreteria)
    appelloT = await appello({ data: fra(12), livelli: ['triennio'] }, segreteria)
    // Turno in più aggiunto dal docente
    appelloT2 = await appello({ data: fra(15), livelli: ['triennio'] }, docente)
  })

  afterAll(async () => {
    for (const c of COLLEZIONI) await payload.delete({ collection: c, where: {} })
  })

  const iscrivi = (user: User, appello: Appello) =>
    payload.create({
      collection: 'iscrizioni-esami',
      data: { appello: appello.id } as never,
      user,
      overrideAccess: false,
    })

  it('l’appello ha un titolo leggibile e i livelli scelti', () => {
    expect(appelloT.titolo).toMatch(/^Storia dell’arte contemporanea \(Triennio\), /)
    expect(appelloB.livelli).toEqual(['biennio'])
  })

  it('il docente aggiunge turni solo ai propri corsi', async () => {
    expect(
      await rifiutato(
        payload.create({
          collection: 'appelli',
          data: {
            corso: corsoAltro.id,
            annoAccademico: '2026/2027',
            sessione: 'invernale',
            data: fra(11),
            ora: '9:00',
          } as Appello,
          user: docente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('il docente non sposta un appello della segreteria ma ne prolunga le iscrizioni', async () => {
    const spostato = await payload.update({
      collection: 'appelli',
      id: appelloT.id,
      data: { aula: 'S34', prorogaIscrizioni: fra(25) },
      user: docente,
      overrideAccess: false,
    })
    expect(spostato.aula).toBe('C28')
    expect(spostato.prorogaIscrizioni).toBeTruthy()
    const suo = await payload.update({
      collection: 'appelli',
      id: appelloT2.id,
      data: { aula: 'R01' },
      user: docente,
      overrideAccess: false,
    })
    expect(suo.aula).toBe('R01')
    expect(
      await rifiutato(
        payload.update({
          collection: 'appelli',
          id: appelloT.id,
          data: { note: 'x' },
          user: altroDocente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('lo studente si iscrive all’appello del suo livello, uno per corso e sessione', async () => {
    const i = await iscrivi(studenteT, appelloT)
    expect(i.matricola).toBe('11111')
    expect(await rifiutato(iscrivi(studenteT, appelloB))).toBe(true) // livello
    expect(await rifiutato(iscrivi(studenteT, appelloT2))).toBe(true) // stesso corso e sessione
    expect((await iscrivi(studenteB, appelloB)).livello).toBe('biennio')
  })

  it('il docente vede gli iscritti ai suoi appelli, l’altro docente no', async () => {
    const suoi = await payload.find({
      collection: 'iscrizioni-esami',
      user: docente,
      overrideAccess: false,
    })
    expect(suoi.totalDocs).toBe(2)
    const altrui = await payload.find({
      collection: 'iscrizioni-esami',
      user: altroDocente,
      overrideAccess: false,
    })
    expect(altrui.totalDocs).toBe(0)
    const a = await payload.findByID({
      collection: 'appelli',
      id: appelloT.id,
      user: docente,
      overrideAccess: false,
    })
    expect(a.iscritti?.docs?.length).toBe(1)
  })

  it('con “solo iscritti al corso” serve l’iscrizione al corso', async () => {
    await payload.update({
      collection: 'finestre-iscrizione',
      id: finestra.id,
      data: { soloIscrittiAlCorso: true },
    })
    const [mia] = (
      await payload.find({
        collection: 'iscrizioni-esami',
        where: { studente: { equals: studenteB.id } },
      })
    ).docs
    await payload.delete({
      collection: 'iscrizioni-esami',
      id: mia.id,
      user: studenteB,
      overrideAccess: false,
    })
    expect(await rifiutato(iscrivi(studenteB, appelloB))).toBe(true)
    await payload.update({
      collection: 'finestre-iscrizione',
      id: finestra.id,
      data: { soloIscrittiAlCorso: false },
    })
  })

  it('le iscrizioni chiudono il giorno dell’esame anche con la finestra aperta', async () => {
    const ieri = await payload.create({
      collection: 'appelli',
      data: {
        corso: corsoAltro.id,
        annoAccademico: '2026/2027',
        sessione: 'invernale',
        data: fra(-0.5),
        ora: '9:00',
      } as Appello,
    })
    expect(await rifiutato(iscrivi(studenteT, ieri))).toBe(true)
  })
})

describe('inizioGiornoRoma', () => {
  it('trova la mezzanotte di Roma in inverno e in estate', async () => {
    const { inizioGiornoRoma } = await import('@/lib/iscrizioni')
    expect(inizioGiornoRoma('2027-02-10T11:00:00.000Z').toISOString()).toBe(
      '2027-02-09T23:00:00.000Z',
    )
    expect(inizioGiornoRoma('2026-09-22T10:00:00.000Z').toISOString()).toBe(
      '2026-09-21T22:00:00.000Z',
    )
  })
})
