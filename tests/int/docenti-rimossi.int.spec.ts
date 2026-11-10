import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DOCENTI_RIMOSSI, impronta, rimuoviDocenti } from '@/seed/docenti-rimossi'

let payload: Payload

describe('Docenti rimossi su richiesta', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'docenti', where: { email: { like: 'rimossi.' } } })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'docenti', where: { email: { like: 'rimossi.' } } })
  })

  it("l'impronta non dipende da maiuscole e spazi", () => {
    expect(impronta(' Nome.Cognome@Albertina.Academy ')).toBe(
      impronta('nome.cognome@albertina.academy'),
    )
    expect(DOCENTI_RIMOSSI.every((h) => /^[0-9a-f]{64}$/.test(h))).toBe(true)
  })

  it("rimuove solo i docenti la cui email ha un'impronta nell'elenco", async () => {
    const daRimuovere = 'rimossi.da-togliere@albertina.academy'
    const daTenere = 'rimossi.da-tenere@albertina.academy'
    for (const email of [daRimuovere, daTenere]) {
      await payload.create({
        collection: 'docenti',
        data: { nome: 'Prova', cognome: email.split('@')[0], email },
        overrideAccess: true,
      })
    }
    DOCENTI_RIMOSSI.push(impronta(daRimuovere))
    try {
      await rimuoviDocenti(payload)
    } finally {
      DOCENTI_RIMOSSI.pop()
    }
    const { docs } = await payload.find({
      collection: 'docenti',
      where: { email: { like: 'rimossi.' } },
      overrideAccess: true,
    })
    expect(docs.map((d) => d.email)).toEqual([daTenere])
  })
})
