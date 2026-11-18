import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

const utente = (email: string, roles: User['roles']) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

describe('Home: chi può modificarla', () => {
  let admin: User
  let redazione: User
  let vicedirezione: User
  let segreteria: User
  let docente: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.home@' } } })
    admin = await utente('admin.home@albertina.academy', ['admin'])
    redazione = await utente('redazione.home@albertina.academy', ['redazione'])
    vicedirezione = await utente('vice.home@albertina.academy', ['vicedirezione'])
    segreteria = await utente('segreteria.home@albertina.academy', ['segreteria'])
    docente = await utente('docente.home@albertina.academy', ['docente'])
  })

  afterAll(async () => {
    await payload.updateGlobal({
      slug: 'home',
      data: { manifesto: null, avvisoMostra: true },
    })
    await payload.delete({ collection: 'users', where: { email: { like: '.home@' } } })
  })

  it('admin, redazione e vicedirezione modificano la home e il pubblico la legge', async () => {
    for (const [user, testo] of [
      [admin, 'Manifesto admin'],
      [redazione, 'Manifesto redazione'],
      [vicedirezione, 'Manifesto vicedirezione'],
    ] as const) {
      await payload.updateGlobal({
        slug: 'home',
        data: { manifesto: testo },
        user,
        overrideAccess: false,
      })
      const pubblico = await payload.findGlobal({ slug: 'home', overrideAccess: false })
      expect(pubblico.manifesto).toBe(testo)
    }
  })

  it('segreteria e docenti non modificano la home', async () => {
    for (const user of [segreteria, docente]) {
      await expect(
        payload.updateGlobal({
          slug: 'home',
          data: { avvisoMostra: false },
          user,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
  })

  it('accessi rapidi: da 2 a 6 e con un indirizzo valido', async () => {
    const voce = {
      titolo: 'Calendari',
      testo: 'Lezioni ed esami',
      icona: 'calendario' as const,
      tipo: 'percorso' as const,
      url: '/calendari',
    }
    await expect(
      payload.updateGlobal({
        slug: 'home',
        data: { accessi: [voce] },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'home',
        data: { accessi: [voce, { ...voce, url: '//evil.example' }] },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('il tour accetta solo indirizzi https', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'home',
        data: { tourUrl: 'http://tour.example' },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
