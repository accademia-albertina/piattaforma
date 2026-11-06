// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { affidaBiblioteca } from '@/seed/biblioteca'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Ruolo Biblioteca', () => {
  let redazione: User
  let biblioteca: User

  const utente = (email: string, roles: User['roles']) =>
    payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

  const pulisci = async () => {
    await payload.delete({ collection: 'avvisi', where: { titolo: { like: '(bib)' } } })
    await payload.delete({ collection: 'pubblicazioni', where: { titolo: { like: '(bib)' } } })
    await payload.delete({ collection: 'pagine', where: { slug: { like: '-bib' } } })
    await payload.delete({ collection: 'users', where: { email: { like: '.bib@' } } })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
    redazione = await utente('redazione.bib@albertina.academy', ['redazione'])
    biblioteca = await utente('ufficio.bib@albertina.academy', ['biblioteca'])
  })

  afterAll(pulisci)

  const pagina = (titolo: string, slug: string) =>
    payload.create({
      collection: 'pagine',
      data: { titolo, slug, _status: 'published' },
      user: redazione,
      overrideAccess: false,
      draft: false,
    })

  it('cura il catalogo Albertina Press ma non elimina i volumi', async () => {
    const volume = await payload.create({
      collection: 'pubblicazioni',
      data: { titolo: 'Quaderno di prova (bib)' },
      user: biblioteca,
      overrideAccess: false,
    })
    const dopo = await payload.update({
      collection: 'pubblicazioni',
      id: volume.id,
      data: { anno: 2026 },
      user: biblioteca,
      overrideAccess: false,
    })
    expect(dopo.anno).toBe(2026)
    expect(
      await rifiutato(
        payload.delete({
          collection: 'pubblicazioni',
          id: volume.id,
          user: biblioteca,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('modifica solo le pagine affidate alla biblioteca', async () => {
    const sua = await pagina('Sala lettura', 'sala-lettura-bib')
    const altra = await pagina('Segreteria', 'segreteria-bib')
    await affidaBiblioteca(payload) // non tocca pagine fuori elenco
    await payload.update({
      collection: 'pagine',
      id: sua.id,
      data: { ufficiEditori: ['biblioteca'] },
      user: redazione,
      overrideAccess: false,
    })
    const dopo = await payload.update({
      collection: 'pagine',
      id: sua.id,
      data: { sommario: 'Orari e servizi.' },
      user: biblioteca,
      overrideAccess: false,
    })
    expect(dopo.sommario).toBe('Orari e servizi.')
    for (const p of [
      payload.update({
        collection: 'pagine',
        id: altra.id,
        data: { sommario: 'No' },
        user: biblioteca,
        overrideAccess: false,
      }),
      pagina('Nuova', 'nuova-bib').then(() =>
        payload.create({
          collection: 'pagine',
          data: { titolo: 'Creata dalla biblioteca', slug: 'creata-bib' },
          user: biblioteca,
          overrideAccess: false,
        }),
      ),
    ]) {
      expect(await rifiutato(p)).toBe(true)
    }
  })

  it('pubblica avvisi solo nella categoria Biblioteca', async () => {
    const base = { pubblicatoIl: new Date().toISOString(), _status: 'published' as const }
    const ok = await payload.create({
      collection: 'avvisi',
      data: { ...base, titolo: 'Chiusura anticipata (bib)', categorie: ['biblioteca'] },
      user: biblioteca,
      overrideAccess: false,
      draft: false,
    })
    expect(ok.categorie).toEqual(['biblioteca'])
    expect(
      await rifiutato(
        payload.create({
          collection: 'avvisi',
          data: { ...base, titolo: 'Avviso generale (bib)', categorie: ['generali'] },
          user: biblioteca,
          overrideAccess: false,
          draft: false,
        }),
      ),
    ).toBe(true)
  })
})
