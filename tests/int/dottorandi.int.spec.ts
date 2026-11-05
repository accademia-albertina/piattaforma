import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Dottorando, User } from '@/payload-types'
import { importaDottorandiWp, PERCORSO_DOTTORANDI } from '@/seed/dottorandi-wp'
import { importaPagineWp } from '@/seed/pagine-wp'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Dottorandi', () => {
  let vicedirezione: User
  let segreteria: User
  let riva: User
  let ravera: User
  let profiloRiva: Dottorando
  let profiloRavera: Dottorando

  const utente = (email: string, roles: User['roles']) =>
    payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'dottorandi', where: {} })
    await payload.delete({ collection: 'users', where: { email: { contains: '.dott@' } } })
    vicedirezione = await utente('vice.dott@albertina.academy', ['vicedirezione'])
    segreteria = await utente('segreteria.dott@albertina.academy', ['segreteria'])
    riva = await utente('alessia.dott@albertina.academy', ['dottorando'])
    ravera = await utente('nuvola.dott@albertina.academy', ['dottorando'])

    const crea = (data: Partial<Dottorando>) =>
      payload.create({
        collection: 'dottorandi',
        data: data as Dottorando,
        user: vicedirezione,
        overrideAccess: false,
      })
    profiloRiva = await crea({ nome: 'Alessia', cognome: 'Riva', ciclo: 'XL', account: riva.id })
    profiloRavera = await crea({ nome: 'Nuvola', cognome: 'Ravera', account: ravera.id })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'dottorandi', where: {} })
    await payload.delete({ collection: 'users', where: { email: { contains: '.dott@' } } })
  })

  it('la vicedirezione crea i profili, con nome completo e indirizzo', () => {
    expect(profiloRiva.nomeCompleto).toBe('Alessia Riva')
    expect(profiloRiva.slug).toBe('alessia-riva')
  })

  it('il dottorando modifica il proprio progetto ma non ciclo, nome o account', async () => {
    const dopo = await payload.update({
      collection: 'dottorandi',
      id: profiloRiva.id,
      data: { titoloProgetto: 'Nuovo titolo', ciclo: 'XLI', cognome: 'Altro', account: ravera.id },
      user: riva,
      overrideAccess: false,
    })
    expect(dopo.titoloProgetto).toBe('Nuovo titolo')
    expect(dopo.ciclo).toBe('XL')
    expect(dopo.cognome).toBe('Riva')
  })

  it('il dottorando non modifica il profilo di un collega', async () => {
    expect(
      await rifiutato(
        payload.update({
          collection: 'dottorandi',
          id: profiloRavera.id,
          data: { titoloProgetto: 'No' },
          user: riva,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('segreteria e dottorandi non creano né cancellano profili', async () => {
    for (const user of [segreteria, riva]) {
      expect(
        await rifiutato(
          payload.create({
            collection: 'dottorandi',
            data: { nome: 'Nuovo', cognome: 'Profilo' },
            user,
            overrideAccess: false,
          }),
        ),
      ).toBe(true)
      expect(
        await rifiutato(
          payload.delete({
            collection: 'dottorandi',
            id: profiloRavera.id,
            user,
            overrideAccess: false,
          }),
        ),
      ).toBe(true)
    }
  })

  it('il pubblico legge i profili ma non l’account collegato', async () => {
    const letto = await payload.findByID({
      collection: 'dottorandi',
      id: profiloRiva.id,
      overrideAccess: false,
    })
    expect(letto.nomeCompleto).toBe('Alessia Riva')
    expect(letto.account).toBeUndefined()
  })

  it('rifiuta ciclo non in numeri romani ed email fuori dominio', async () => {
    for (const data of [{ ciclo: '41' }, { email: 'alessia@gmail.com' }]) {
      expect(
        await rifiutato(
          payload.update({
            collection: 'dottorandi',
            id: profiloRiva.id,
            data,
            user: vicedirezione,
            overrideAccess: false,
          }),
        ),
      ).toBe(true)
    }
  })

  it('importa i profili del sito attuale senza toccare quelli già scritti e toglie le vecchie pagine', async () => {
    // Come nell'anteprima: il profilo era stato importato come sottopagina di Dottorandi
    await importaPagineWp(payload)
    const elenco = (
      await payload.find({
        collection: 'pagine',
        where: { percorso: { equals: PERCORSO_DOTTORANDI } },
        limit: 1,
      })
    ).docs[0]
    const vecchia = await payload.create({
      collection: 'pagine',
      draft: false,
      context: { importazione: true },
      data: {
        titolo: 'Giulia Deval',
        slug: 'giulia-deval',
        genitore: elenco.id,
        _status: 'published',
      },
    })
    expect(vecchia.percorso).toBe(`${PERCORSO_DOTTORANDI}/giulia-deval`)

    await importaDottorandiWp(payload)
    await importaDottorandiWp(payload)

    const { docs } = await payload.find({ collection: 'dottorandi', pagination: false })
    // 13 dal sito attuale; Riva e Ravera c'erano già e non si duplicano
    expect(docs).toHaveLength(13)
    const riva = docs.find((d) => d.slug === 'alessia-riva')
    expect(riva?.titoloProgetto).toBe('Nuovo titolo')
    expect(riva?.biografia).toBeTruthy()
    const deval = docs.find((d) => d.slug === 'giulia-deval')
    expect(deval?.titoloProgetto).toMatch(/^Politiche della voce/)
    expect(deval?.abstract).toBeTruthy()
    // Sul sito attuale due profili hanno l'email di Giulia Roversi: non si importa
    expect(docs.filter((d) => d.email === 'giulia.roversi@albertina.academy')).toHaveLength(1)

    expect(
      await payload.count({ collection: 'pagine', where: { id: { equals: vecchia.id } } }),
    ).toEqual({ totalDocs: 0 })
    const dopo = await payload.findByID({ collection: 'pagine', id: elenco.id })
    expect(dopo.sommario).toMatch(/dottorandi/i)
  })
})
