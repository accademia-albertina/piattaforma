import { createLocalReq, getPayload, type Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { disponibilita, improntaCodiceEmail, leggiImpostazioni } from '@/lib/sportello'
import { giornoRoma, istanteRoma } from '@/lib/sportello-orari'
import type { PrenotazioneSegreteria, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const utente = (email: string, roles: User['roles'], extra: Partial<User> = {}) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles, ...extra } })
const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

/** Chiama un endpoint della collezione come farebbe il sito. */
async function endpoint(path: string, corpo: Record<string, unknown>, user?: User) {
  const ep = payload.collections['prenotazioni-segreteria'].config.endpoints
    ? (
        payload.collections['prenotazioni-segreteria'].config.endpoints as {
          path: string
          handler: (req: unknown) => Promise<Response>
        }[]
      ).find((e) => e.path === path)!
    : null
  const req = await createLocalReq({ user: user as never, context: { senzaEmail: true } }, payload)
  ;(req as unknown as { json: () => Promise<unknown> }).json = async () => corpo
  const r = await ep!.handler(req)
  return {
    status: r.status,
    corpo: (await r.json()) as { doc: { id: number }; errors: { message: string }[] },
  }
}

const COLLEZIONI = ['prenotazioni-segreteria', 'codici-email', 'users'] as const

describe('Prenotazioni allo sportello della segreteria', () => {
  let segreteria: User
  let studente: User
  let altroStudente: User
  let docente: User
  let turni: { inizio: string }[]

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const c of COLLEZIONI)
      await payload.delete({ collection: c, where: {}, overrideAccess: true })
    await payload.updateGlobal({
      slug: 'sportello-segreteria',
      data: {
        attivo: true,
        durataTurno: 5,
        personePerTurno: 1,
        giorniPrenotabili: 60,
        orari: (['1', '2', '3', '4', '5'] as const).map((giorno) => ({
          giorno,
          dalle: '10:00',
          alle: '12:00',
        })),
        chiusure: [],
        aperture: [],
        documenti: [
          { nome: 'Libretto', attivo: true },
          { nome: 'Pergamena di laurea', attivo: true },
        ],
      },
      context: { senzaEmail: true },
    })
    segreteria = await utente('segreteria.sportello@albertina.academy', ['segreteria'])
    studente = await utente('11111t@albertina.academy', ['studente'], {
      nome: 'Giulia',
      cognome: 'Bianchi',
    })
    altroStudente = await utente('22222b@albertina.academy', ['studente'])
    docente = await utente('aldo.bianchi@albertina.academy', ['docente'])
    const imp = await leggiImpostazioni(payload)
    const giorni = await disponibilita(payload, imp)
    // Un giorno da domani in poi, con tutti i turni futuri
    turni = giorni.find((g) => g.data > giornoRoma(new Date()))!.turni
  })

  afterAll(async () => {
    for (const c of COLLEZIONI)
      await payload.delete({ collection: c, where: {}, overrideAccess: true })
  })

  const documento = async (nome: string) =>
    (await leggiImpostazioni(payload)).documenti.find((d) => d.nome === nome)!.id

  it('lo studente prenota con l’account; i dati vengono dall’account', async () => {
    const r = await endpoint(
      '/prenota',
      { documento: await documento('Libretto'), inizio: turni[0].inizio },
      studente,
    )
    expect(r.status).toBe(201)
    const p = await payload.findByID({ collection: 'prenotazioni-segreteria', id: r.corpo.doc.id })
    expect(p).toMatchObject({
      tipo: 'studente',
      matricola: '11111',
      nominativo: 'Bianchi Giulia',
      email: '11111t@albertina.academy',
      stato: 'prenotata',
    })
  })

  it('un turno pieno non si prenota due volte', async () => {
    const r = await endpoint(
      '/prenota',
      { documento: await documento('Pergamena di laurea'), inizio: turni[0].inizio },
      altroStudente,
    )
    expect(r.status).toBe(409)
  })

  it('una sola prenotazione attiva per documento', async () => {
    const r = await endpoint(
      '/prenota',
      { documento: await documento('Libretto'), inizio: turni[1].inizio },
      studente,
    )
    expect(r.status).toBe(409)
    expect(r.corpo.errors[0].message).toMatch(/già un appuntamento/)
  })

  it('un orario fuori dai turni è rifiutato', async () => {
    const fuori = istanteRoma(giornoRoma(new Date(turni[0].inizio)), '13:00').toISOString()
    const r = await endpoint(
      '/prenota',
      { documento: await documento('Pergamena di laurea'), inizio: fuori },
      altroStudente,
    )
    expect(r.status).toBe(409)
  })

  it('l’esterno conferma con il codice ricevuto via email', async () => {
    const email = 'anna.verdi@example.com'
    const dati = {
      documento: await documento('Pergamena di laurea'),
      inizio: turni[2].inizio,
      nome: 'Anna',
      cognome: 'Verdi',
      email,
      telefono: '+39 333 0000000',
    }
    expect((await endpoint('/prenota', { ...dati, codice: '000000' })).status).toBe(401)
    expect((await endpoint('/codice', { email: '12345t@albertina.academy' })).status).toBe(400)
    expect((await endpoint('/codice', { email })).status).toBe(200)
    // Il codice vero non si legge: se ne crea uno noto per la prova
    await payload.create({
      collection: 'codici-email',
      data: {
        email,
        impronta: improntaCodiceEmail(email, '123456'),
        scadenza: new Date(Date.now() + 600_000).toISOString(),
      },
      overrideAccess: true,
    })
    expect((await endpoint('/prenota', { ...dati, codice: '654321' })).status).toBe(401)
    const ok = await endpoint('/prenota', { ...dati, codice: '123456' })
    expect(ok.status).toBe(201)
    // Il codice vale una volta sola
    const ancora = await endpoint('/prenota', {
      ...dati,
      inizio: turni[3].inizio,
      codice: '123456',
    })
    expect(ancora.status).toBe(401)
  })

  it('permessi: studente vede solo le sue, segreteria tutte, docente e anonimo nessuna', async () => {
    const proprie = await payload.find({
      collection: 'prenotazioni-segreteria',
      user: studente,
      overrideAccess: false,
    })
    expect(proprie.docs.map((p) => p.email)).toEqual(['11111t@albertina.academy'])
    expect(proprie.docs[0]).not.toHaveProperty('tokenDisdetta')
    const tutte = await payload.find({
      collection: 'prenotazioni-segreteria',
      user: segreteria,
      overrideAccess: false,
    })
    expect(tutte.totalDocs).toBe(2)
    const delDocente = await payload.find({
      collection: 'prenotazioni-segreteria',
      user: docente,
      overrideAccess: false,
    })
    expect(delDocente.totalDocs).toBe(0)
    expect(
      await rifiutato(
        payload.find({ collection: 'prenotazioni-segreteria', overrideAccess: false }),
      ),
    ).toBe(true)
    expect(
      await rifiutato(
        payload.create({
          collection: 'prenotazioni-segreteria',
          data: { documento: 'Libretto', inizio: turni[5].inizio, email: 'x@example.com' },
          user: studente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('disdetta: libera il turno; un altro studente non può disdire quella altrui', async () => {
    const [mia] = (
      await payload.find({
        collection: 'prenotazioni-segreteria',
        where: { email: { equals: '11111t@albertina.academy' } },
      })
    ).docs as PrenotazioneSegreteria[]
    expect((await endpoint('/disdici', { id: mia.id }, altroStudente)).status).toBe(404)
    expect((await endpoint('/disdici', { id: mia.id }, studente)).status).toBe(200)
    const dopo = await payload.findByID({ collection: 'prenotazioni-segreteria', id: mia.id })
    expect(dopo).toMatchObject({ stato: 'annullata', annullataDa: 'utente' })
    const r = await endpoint(
      '/prenota',
      { documento: await documento('Libretto'), inizio: turni[0].inizio },
      altroStudente,
    )
    expect(r.status).toBe(201)
  })

  it('la segreteria segna ritirato e annulla con motivo', async () => {
    const { docs } = await payload.find({
      collection: 'prenotazioni-segreteria',
      where: { stato: { equals: 'prenotata' } },
      sort: 'inizio',
    })
    const ritirata = await payload.update({
      collection: 'prenotazioni-segreteria',
      id: docs[0].id,
      data: { stato: 'ritirata' },
      user: segreteria,
      overrideAccess: false,
      context: { senzaEmail: true },
    })
    expect(ritirata.stato).toBe('ritirata')
    expect(
      await rifiutato(
        payload.update({
          collection: 'prenotazioni-segreteria',
          id: docs[1].id,
          data: { stato: 'annullata' },
          user: studente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('una chiusura straordinaria annulla le prenotazioni di quel giorno', async () => {
    const giorno = giornoRoma(new Date(turni[2].inizio))
    await payload.updateGlobal({
      slug: 'sportello-segreteria',
      data: { chiusure: [{ dal: `${giorno}T12:00:00.000Z`, motivo: 'Sciopero' }] },
      context: { senzaEmail: true },
    })
    const { docs } = await payload.find({
      collection: 'prenotazioni-segreteria',
      where: { email: { equals: 'anna.verdi@example.com' } },
    })
    expect(docs[0]).toMatchObject({
      stato: 'annullata',
      annullataDa: 'chiusura',
      motivoAnnullamento: 'Sciopero',
    })
    const imp = await leggiImpostazioni(payload)
    const giorni = await disponibilita(payload, imp)
    expect(giorni.find((g) => g.data === giorno)).toBeUndefined()
  })
})
