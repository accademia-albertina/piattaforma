import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { importaPagineWp } from '@/seed/pagine-wp'

let payload: Payload

describe('Importazione delle pagine del sito attuale', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pagine', where: {} })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pagine', where: {} })
  })

  it('crea le pagine con la gerarchia e gli indirizzi del sito attuale', async () => {
    await importaPagineWp(payload)
    const { docs } = await payload.find({
      collection: 'pagine',
      pagination: false,
      depth: 1,
      overrideAccess: false,
    })
    const per = new Map(docs.map((d) => [d.percorso, d]))
    expect(per.size).toBeGreaterThanOrEqual(35)
    const tesi = per.get('studente/tesi')
    expect(tesi?._status).toBe('published')
    expect(typeof tesi?.genitore === 'object' && tesi.genitore?.percorso).toBe('studente')
    expect(per.has('erasmus/mobilita-studenti')).toBe(true)
    expect(per.has('dottorati/albertina/dottorandi')).toBe(true)
    // I profili dei dottorandi stanno nella collezione Dottorandi, non in Pagine
    expect([...per.keys()].some((p) => p?.startsWith('dottorati/albertina/dottorandi/'))).toBe(false)
  })

  it('non crea doppioni e non tocca le pagine già presenti', async () => {
    const prima = await payload.count({ collection: 'pagine' })
    const tasse = (
      await payload.find({
        collection: 'pagine',
        where: { percorso: { equals: 'studente/tasse' } },
      })
    ).docs[0]
    await payload.update({
      collection: 'pagine',
      id: tasse.id,
      data: { sommario: 'Modificato nel pannello' },
    })
    await importaPagineWp(payload)
    expect((await payload.count({ collection: 'pagine' })).totalDocs).toBe(prima.totalDocs)
    const dopo = await payload.findByID({ collection: 'pagine', id: tasse.id })
    expect(dopo.sommario).toBe('Modificato nel pannello')
  })
})
