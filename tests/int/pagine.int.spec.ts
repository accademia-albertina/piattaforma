import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

async function utente(email: string, roles: User['roles']) {
  return payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })
}

describe('Pagine: percorsi e permessi', () => {
  let admin: User
  let redazione: User
  let segreteria: User
  let erasmus: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pagine', where: {} })
    await payload.delete({ collection: 'users', where: { email: { like: '.pagine@' } } })
    admin = await utente('admin.pagine@albertina.academy', ['admin'])
    redazione = await utente('redazione.pagine@albertina.academy', ['redazione'])
    segreteria = await utente('segreteria.pagine@albertina.academy', ['segreteria'])
    erasmus = await utente('erasmus.pagine@albertina.academy', ['erasmus'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pagine', where: {} })
    await payload.delete({ collection: 'users', where: { email: { like: '.pagine@' } } })
  })

  const crea = (data: Record<string, unknown>, user: User = redazione) =>
    payload.create({
      collection: 'pagine',
      data: { _status: 'published', ...data } as never,
      user,
      overrideAccess: false,
      draft: false,
    })

  it('il percorso segue la pagina genitore e si aggiorna a cascata', async () => {
    const accademia = await crea({ titolo: 'Accademia' })
    const storia = await crea({ titolo: 'Storia', genitore: accademia.id })
    const archivio = await crea({ titolo: 'Archivio storico', genitore: storia.id })
    expect(storia.percorso).toBe('accademia/storia')
    expect(archivio.percorso).toBe('accademia/storia/archivio-storico')

    await payload.update({
      collection: 'pagine',
      id: accademia.id,
      data: { slug: 'istituzione' },
      user: redazione,
      overrideAccess: false,
    })
    const dopo = await payload.findByID({ collection: 'pagine', id: archivio.id })
    expect(dopo.percorso).toBe('istituzione/storia/archivio-storico')
  })

  it('una pagina non può stare dentro una sua sottopagina', async () => {
    const madre = await crea({ titolo: 'Sezione madre' })
    const figlia = await crea({ titolo: 'Sezione figlia', genitore: madre.id })
    await expect(
      payload.update({
        collection: 'pagine',
        id: madre.id,
        data: { genitore: figlia.id },
        user: redazione,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/dentro se stessa/)
  })

  it('gli indirizzi del sito sono riservati al primo livello', async () => {
    await expect(crea({ titolo: 'Avvisi' })).rejects.toThrow()
    const didattica = await crea({ titolo: 'Didattica' })
    const sotto = await crea({ titolo: 'Avvisi', genitore: didattica.id })
    expect(sotto.percorso).toBe('didattica/avvisi')
  })

  it('un ufficio modifica solo le pagine che gli sono affidate', async () => {
    const iscrizioni = await crea({ titolo: 'Iscrizioni', ufficiEditori: ['segreteria'] })
    const erasmusPag = await crea({ titolo: 'Mobilità', ufficiEditori: ['erasmus'] })

    const ok = await payload.update({
      collection: 'pagine',
      id: iscrizioni.id,
      data: { sommario: 'Scadenze e modalità' },
      user: segreteria,
      overrideAccess: false,
    })
    expect(ok.sommario).toBe('Scadenze e modalità')

    await expect(
      payload.update({
        collection: 'pagine',
        id: erasmusPag.id,
        data: { sommario: 'Modifica non permessa' },
        user: segreteria,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    // L'ufficio non può allargare i permessi della pagina: il campo resta com'era.
    const tentativo = await payload.update({
      collection: 'pagine',
      id: iscrizioni.id,
      data: { ufficiEditori: ['segreteria', 'erasmus'] },
      user: segreteria,
      overrideAccess: false,
    })
    expect(tentativo.ufficiEditori).toEqual(['segreteria'])
    void erasmus
  })

  it('gli uffici non creano pagine e solo l’admin le elimina', async () => {
    await expect(crea({ titolo: 'Pagina segreteria' }, segreteria)).rejects.toThrow()
    const p = await crea({ titolo: 'Da eliminare' })
    await expect(
      payload.delete({ collection: 'pagine', id: p.id, user: redazione, overrideAccess: false }),
    ).rejects.toThrow()
    await payload.delete({ collection: 'pagine', id: p.id, user: admin, overrideAccess: false })
  })

  it('il pubblico non vede le bozze', async () => {
    await payload.create({
      collection: 'pagine',
      data: { titolo: 'Pagina in lavorazione' },
      user: redazione,
      overrideAccess: false,
      draft: true,
    })
    const pubbliche = await payload.find({
      collection: 'pagine',
      overrideAccess: false,
      limit: 100,
    })
    expect(pubbliche.docs.map((p) => p.titolo)).not.toContain('Pagina in lavorazione')
  })
})
