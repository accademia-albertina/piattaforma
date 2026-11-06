import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { statoFinestra } from '@/access/iscrizioni'
import type { Corso, FinestraIscrizione, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const GIORNO = 24 * 60 * 60 * 1000
const fra = (giorni: number) => new Date(Date.now() + giorni * GIORNO).toISOString()

const utente = (email: string, roles: User['roles'], extra: Partial<User> = {}) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles, ...extra } })

const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('statoFinestra', () => {
  const f = { apertura: '2026-10-01T07:00:00.000Z', chiusura: '2026-10-31T22:59:00.000Z' }
  it('distingue prima, aperta e chiusa', () => {
    expect(statoFinestra(null).stato).toBe('nessuna')
    expect(statoFinestra(f, null, new Date('2026-09-30')).stato).toBe('prima')
    expect(statoFinestra(f, null, new Date('2026-10-15')).stato).toBe('aperta')
    expect(statoFinestra(f, null, new Date('2026-11-05')).stato).toBe('chiusa')
  })
  it('la proroga del docente allunga, non accorcia', () => {
    expect(statoFinestra(f, '2026-11-10T00:00:00.000Z', new Date('2026-11-05')).stato).toBe(
      'aperta',
    )
    expect(statoFinestra(f, '2026-10-10T00:00:00.000Z', new Date('2026-10-20')).stato).toBe(
      'aperta',
    )
  })
})

describe('Iscrizioni ai corsi: permessi e finestre', () => {
  let segreteria: User
  let docente: User
  let altroDocente: User
  let studenteT: User
  let studenteT2: User
  let studenteB: User
  let corsoAperto: Corso
  let corsoChiuso: Corso
  let corsoAltro: Corso
  let finestraPrimo: FinestraIscrizione

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const c of [
      'iscrizioni-corsi',
      'finestre-iscrizione',
      'corsi',
      'docenti',
      'users',
    ] as const) {
      await payload.delete({ collection: c, where: {} })
    }
    await utente('admin.iscrizioni@albertina.academy', ['admin'])
    segreteria = await utente('segreteria.iscrizioni@albertina.academy', ['segreteria'])
    docente = await utente('paola.verdi@albertina.academy', ['docente'])
    altroDocente = await utente('luca.neri@albertina.academy', ['docente'])
    studenteT = await utente('12345t@albertina.academy', ['studente'], {
      nome: 'Giulia',
      cognome: 'Bassi',
    })
    studenteT2 = await utente('12346t@albertina.academy', ['studente'])
    studenteB = await utente('54321b@albertina.academy', ['studente'])

    const profilo = await payload.create({
      collection: 'docenti',
      data: { nome: 'Paola', cognome: 'Verdi', account: docente.id },
    })
    const profiloAltro = await payload.create({
      collection: 'docenti',
      data: { nome: 'Luca', cognome: 'Neri', account: altroDocente.id },
    })
    const corso = (titolo: string, periodo: 'primo' | 'secondo', docenteId: number) =>
      payload.create({
        collection: 'corsi',
        draft: false,
        data: {
          titolo,
          livelli: ['triennio'],
          annoAccademico: '2026/2027',
          docenti: [docenteId],
          periodoIscrizione: periodo,
          _status: 'published',
        },
      })
    corsoAperto = await corso('Anatomia artistica', 'primo', profilo.id)
    corsoChiuso = await corso('Disegno', 'secondo', profilo.id)
    corsoAltro = await corso('Incisione', 'primo', profiloAltro.id)

    const finestra = (periodo: string, apertura: string, chiusura: string) =>
      payload.create({
        collection: 'finestre-iscrizione',
        data: {
          tipo: 'corsi',
          annoAccademico: '2026/2027',
          periodo,
          apertura,
          chiusura,
        } as FinestraIscrizione,
        user: segreteria,
        overrideAccess: false,
      })
    finestraPrimo = await finestra('primo', fra(-1), fra(10))
    await finestra('secondo', fra(-20), fra(-5))
  })

  afterAll(async () => {
    for (const c of [
      'iscrizioni-corsi',
      'finestre-iscrizione',
      'corsi',
      'docenti',
      'users',
    ] as const) {
      await payload.delete({ collection: c, where: {} })
    }
  })

  const iscrivi = (user: User, corso: Corso) =>
    payload.create({
      collection: 'iscrizioni-corsi',
      data: { corso: corso.id } as never,
      user,
      overrideAccess: false,
    })

  it('la segreteria apre le finestre, il docente no; una sola per periodo', async () => {
    expect(finestraPrimo.titolo).toBe('Iscrizioni ai corsi, primo semestre 2026/2027')
    expect(
      await rifiutato(
        payload.create({
          collection: 'finestre-iscrizione',
          data: {
            tipo: 'corsi',
            annoAccademico: '2026/2027',
            periodo: 'primo',
            apertura: fra(1),
            chiusura: fra(2),
          } as FinestraIscrizione,
          user: docente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
    expect(
      await rifiutato(
        payload.create({
          collection: 'finestre-iscrizione',
          data: {
            tipo: 'corsi',
            annoAccademico: '2026/2027',
            periodo: 'primo',
            apertura: fra(1),
            chiusura: fra(2),
          } as FinestraIscrizione,
          user: segreteria,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('lo studente si iscrive a finestra aperta e i dati vengono dall’account', async () => {
    const i = await iscrivi(studenteT, corsoAperto)
    expect(i.nominativo).toBe('Bassi Giulia')
    expect(i.matricola).toBe('12345')
    expect(i.livello).toBe('triennio')
    expect(typeof i.studente === 'object' ? i.studente.id : i.studente).toBe(studenteT.id)
  })

  it('niente doppioni, niente finestra chiusa, niente corsi di un altro livello', async () => {
    expect(await rifiutato(iscrivi(studenteT, corsoAperto))).toBe(true)
    expect(await rifiutato(iscrivi(studenteT, corsoChiuso))).toBe(true)
    expect(await rifiutato(iscrivi(studenteB, corsoAperto))).toBe(true)
  })

  it('lo studente non può iscrivere un altro studente', async () => {
    const i = await payload.create({
      collection: 'iscrizioni-corsi',
      data: { corso: corsoAltro.id, studente: studenteT2.id } as never,
      user: studenteT,
      overrideAccess: false,
    })
    expect(typeof i.studente === 'object' ? i.studente.id : i.studente).toBe(studenteT.id)
  })

  it('la proroga del docente riapre il suo corso', async () => {
    expect(await rifiutato(iscrivi(studenteT2, corsoChiuso))).toBe(true)
    await payload.update({
      collection: 'corsi',
      id: corsoChiuso.id,
      draft: false,
      data: { prorogaIscrizioni: fra(3), _status: 'published' },
      user: docente,
      overrideAccess: false,
    })
    const i = await iscrivi(studenteT2, corsoChiuso)
    expect(i.id).toBeTruthy()
  })

  it('il docente vede solo gli iscritti ai suoi corsi, lo studente solo i propri', async () => {
    const delDocente = await payload.find({
      collection: 'iscrizioni-corsi',
      user: docente,
      overrideAccess: false,
    })
    expect(delDocente.docs.map((d) => d.nominativo).sort()).toEqual([
      '12346t@albertina.academy',
      'Bassi Giulia',
    ])
    const dellAltro = await payload.find({
      collection: 'iscrizioni-corsi',
      user: altroDocente,
      overrideAccess: false,
    })
    expect(dellAltro.totalDocs).toBe(1)
    const delloStudente = await payload.find({
      collection: 'iscrizioni-corsi',
      user: studenteT2,
      overrideAccess: false,
    })
    expect(delloStudente.totalDocs).toBe(1)
  })

  it('il docente vede gli iscritti nella scheda del corso', async () => {
    const c = await payload.findByID({
      collection: 'corsi',
      id: corsoAperto.id,
      user: docente,
      overrideAccess: false,
      depth: 1,
    })
    expect(c.iscritti?.docs?.length).toBe(1)
  })

  it('lo studente annulla a finestra aperta; dopo la chiusura solo la segreteria', async () => {
    const [mia] = (
      await payload.find({
        collection: 'iscrizioni-corsi',
        where: { corso: { equals: corsoAltro.id } },
      })
    ).docs
    expect(
      await rifiutato(
        payload.delete({
          collection: 'iscrizioni-corsi',
          id: mia.id,
          user: studenteT2,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
    await payload.delete({
      collection: 'iscrizioni-corsi',
      id: mia.id,
      user: studenteT,
      overrideAccess: false,
    })

    // Chiude la finestra del primo semestre
    await payload.update({
      collection: 'finestre-iscrizione',
      id: finestraPrimo.id,
      data: { apertura: fra(-10), chiusura: fra(-1) },
    })
    const [altra] = (
      await payload.find({
        collection: 'iscrizioni-corsi',
        where: { corso: { equals: corsoAperto.id } },
      })
    ).docs
    expect(
      await rifiutato(
        payload.delete({
          collection: 'iscrizioni-corsi',
          id: altra.id,
          user: studenteT,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
    await payload.delete({
      collection: 'iscrizioni-corsi',
      id: altra.id,
      user: segreteria,
      overrideAccess: false,
    })
  })

  it('il docente non modifica né cancella le iscrizioni', async () => {
    const [i] = (await payload.find({ collection: 'iscrizioni-corsi' })).docs
    expect(
      await rifiutato(
        payload.delete({
          collection: 'iscrizioni-corsi',
          id: i.id,
          user: docente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })
})
