// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { azioneDaStato } from '@/lib/registro'
import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const ORA = new Date().toISOString()

const utente = (email: string, roles: User['roles']) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

const vociDi = async (collezione: string, documentoId: string | number) =>
  (
    await payload.find({
      collection: 'registro-attivita',
      where: { collezione: { equals: collezione }, documentoId: { equals: String(documentoId) } },
      sort: 'createdAt',
      overrideAccess: true,
      depth: 0,
    })
  ).docs

describe('Registro attività del pannello', () => {
  let admin: User
  let redazione: User
  let studente: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.registro@' } } })
    admin = await utente('admin.registro@albertina.academy', ['admin'])
    redazione = await utente('redazione.registro@albertina.academy', ['redazione'])
    studente = await utente('studente.registro@albertina.academy', ['studente'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'avvisi', where: { titolo: { like: 'Registro prova' } } })
    await payload.delete({ collection: 'users', where: { email: { like: '.registro@' } } })
  })

  it('registra creazione, modifica con i nomi dei campi ed eliminazione', async () => {
    const avviso = await payload.create({
      collection: 'avvisi',
      data: { titolo: 'Registro prova avviso', pubblicatoIl: ORA, categorie: ['eventi'] },
      user: redazione,
      overrideAccess: false,
    })
    await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: { sommario: 'Nuovo sommario' },
      user: redazione,
      overrideAccess: false,
    })
    // Salvare senza cambiare nulla non è un'attività
    await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: {},
      user: redazione,
      overrideAccess: false,
    })
    await payload.delete({
      collection: 'avvisi',
      id: avviso.id,
      user: admin,
      overrideAccess: false,
    })

    const voci = await vociDi('avvisi', avviso.id)
    expect(voci.map((v) => v.azione)).toEqual(['creato', 'modificato', 'eliminato'])
    expect(voci[0]).toMatchObject({
      collezione: 'avvisi',
      sezione: 'Avvisi',
      titolo: 'Registro prova avviso',
      utenteEmail: 'redazione.registro@albertina.academy',
    })
    expect(voci[1].campi).toBe('Sommario')
    expect(voci[2].utente).toBe(admin.id)
  })

  it('non registra le operazioni senza utente né quelle degli studenti', async () => {
    const avviso = await payload.create({
      collection: 'avvisi',
      data: { titolo: 'Registro prova import', pubblicatoIl: ORA, categorie: ['lezioni'] },
    })
    expect(await vociDi('avvisi', avviso.id)).toHaveLength(0)
    // Lo studente modifica solo il proprio account: non è lavoro nel pannello
    await payload.update({
      collection: 'users',
      id: studente.id,
      data: { nome: 'Prova' },
      user: studente,
      overrideAccess: false,
    })
    expect(await vociDi('users', studente.id)).toHaveLength(0)
  })

  it('riconosce pubblicazione e ritiro delle bozze', () => {
    expect(azioneDaStato('create', undefined, { _status: 'draft' })).toBe('creato')
    expect(azioneDaStato('create', undefined, { _status: 'published' })).toBe('pubblicato')
    expect(azioneDaStato('update', { _status: 'draft' }, { _status: 'published' })).toBe(
      'pubblicato',
    )
    expect(azioneDaStato('update', { _status: 'published' }, { _status: 'draft' })).toBe('ritirato')
    // "Salva bozza" su un elemento pubblicato: la versione online resta
    expect(azioneDaStato('update', { _status: 'published' }, { _status: 'draft' }, true)).toBe(
      'modificato',
    )
    expect(azioneDaStato('update', { _status: 'published' }, { _status: 'published' })).toBe(
      'modificato',
    )
  })

  it('solo gli admin leggono il registro e nessuno può scriverlo o cancellarlo', async () => {
    const lettura = (user: User) =>
      payload.find({ collection: 'registro-attivita', user, overrideAccess: false, depth: 0 })
    await expect(lettura(admin)).resolves.toBeDefined()
    await expect(lettura(redazione)).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'registro-attivita',
        data: { azione: 'creato', collezione: 'avvisi' },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({
        collection: 'registro-attivita',
        where: { id: { exists: true } },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
