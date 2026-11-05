import { getPayload, Payload, ValidationError } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { correggiTitoliMaiuscoli } from '@/seed/titoli-maiuscoli'

let payload: Payload
const MAIUSCOLO = 'REGOLAMENTO PER LA SESSIONE STRAORDINARIA DEGLI ESAMI'

describe('Titoli tutti in maiuscolo', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pagine', where: { slug: { contains: 'sessione-prova' } } })
  })

  it('il pannello rifiuta un titolo tutto maiuscolo, con un messaggio chiaro', async () => {
    const errore = await payload
      .create({
        collection: 'pagine',
        data: { titolo: MAIUSCOLO, slug: 'sessione-prova-1', _status: 'published' },
      })
      .then(() => null)
      .catch((e: unknown) => e)
    expect(errore).toBeInstanceOf(ValidationError)
    const campi = (errore as ValidationError).data.errors
    expect(campi.map((c) => c.path)).toEqual(['titolo'])
    expect(campi[0].message).toMatch(/maiuscolo/)
  })

  it('i titoli maiuscoli già salvati vengono riscritti in frase', async () => {
    const pagina = await payload.create({
      collection: 'pagine',
      data: { titolo: 'Regolamento', slug: 'sessione-prova-2', _status: 'published' },
    })
    // Simula un titolo importato prima della regola, scritto direttamente nel database
    await payload.db.updateOne({ collection: 'pagine', id: pagina.id, data: { titolo: MAIUSCOLO } })
    await correggiTitoliMaiuscoli(payload)
    const dopo = await payload.findByID({ collection: 'pagine', id: pagina.id })
    expect(dopo.titolo).toBe('Regolamento per la sessione straordinaria degli esami')
  })
})
