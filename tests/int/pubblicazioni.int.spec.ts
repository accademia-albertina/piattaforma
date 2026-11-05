// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { importaAlbertinaPress } from '@/seed/albertina-press'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Albertina Press', () => {
  let redazione: User
  let docente: User
  let vicedirezione: User

  const utente = (email: string, roles: User['roles']) =>
    payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pubblicazioni', where: {} })
    await payload.delete({ collection: 'users', where: { email: { contains: '.press@' } } })
    redazione = await utente('redazione.press@albertina.academy', ['redazione'])
    docente = await utente('docente.press@albertina.academy', ['docente'])
    vicedirezione = await utente('vice.press@albertina.academy', ['vicedirezione'])
  }, 60_000)

  afterAll(async () => {
    await payload.delete({ collection: 'pubblicazioni', where: {} })
    await payload.delete({ collection: 'media', where: { alt: { like: 'Copertina di' } } })
    await payload.delete({ collection: 'users', where: { email: { contains: '.press@' } } })
  })

  it('la redazione aggiunge un volume; un docente no', async () => {
    const volume = await payload.create({
      collection: 'pubblicazioni',
      data: { titolo: 'Volume di prova', collana: 'visioni', numero: 500, isbn: '979-12-82089-05-0' },
      user: redazione,
      overrideAccess: false,
    })
    expect(volume.slug).toBe('volume-di-prova')
    expect(
      await rifiutato(
        payload.create({
          collection: 'pubblicazioni',
          data: { titolo: 'Altro volume' },
          user: docente,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
    // Eliminare spetta solo agli admin, nemmeno alla vicedirezione
    expect(
      await rifiutato(
        payload.delete({
          collection: 'pubblicazioni',
          id: volume.id,
          user: vicedirezione,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('rifiuta titoli tutti in maiuscolo e ISBN non validi', async () => {
    const crea = (data: { titolo: string; isbn?: string }) =>
      rifiutato(
        payload.create({ collection: 'pubblicazioni', data, user: redazione, overrideAccess: false }),
      )
    expect(await crea({ titolo: 'TUTTO MAIUSCOLO GRIDATO' })).toBe(true)
    expect(await crea({ titolo: 'Titolo corretto', isbn: 'non è un isbn' })).toBe(true)
  })

  it("importa il catalogo dal sito attuale una sola volta, con copertine e indice", async () => {
    await payload.delete({ collection: 'pubblicazioni', where: {} })
    await importaAlbertinaPress(payload)
    const { totalDocs, docs } = await payload.find({
      collection: 'pubblicazioni',
      sort: '-numero',
      limit: 1,
      depth: 1,
    })
    expect(totalDocs).toBe(99)
    const ultimo = docs[0]
    expect(ultimo.numero).toBe(99)
    expect(ultimo.collana).toBe('r-esistenze')
    expect(typeof ultimo.copertina === 'object' && ultimo.copertina?.mimeType).toBe('image/webp')
    expect(ultimo.indice?.[0]).toMatchObject({ pagina: '10', titolo: 'Editoriale', autori: 'Andrea Balzola' })
    // Una seconda importazione non duplica nulla
    await importaAlbertinaPress(payload)
    expect((await payload.count({ collection: 'pubblicazioni' })).totalDocs).toBe(99)
  }, 240_000)
})
