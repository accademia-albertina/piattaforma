import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

describe('Menu del sito: chi può modificarlo', () => {
  let admin: User
  let redazione: User
  let segreteria: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.menu@' } } })
    admin = await payload.create({
      collection: 'users',
      data: { email: 'admin.menu@albertina.academy', password: PASSWORD, roles: ['admin'] },
    })
    redazione = await payload.create({
      collection: 'users',
      data: { email: 'redazione.menu@albertina.academy', password: PASSWORD, roles: ['redazione'] },
    })
    segreteria = await payload.create({
      collection: 'users',
      data: {
        email: 'segreteria.menu@albertina.academy',
        password: PASSWORD,
        roles: ['segreteria'],
      },
    })
  })

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'navigazione', data: { inEvidenza: [] } })
    await payload.delete({ collection: 'users', where: { email: { like: '.menu@' } } })
  })

  it('l’admin modifica il menu e il pubblico lo legge', async () => {
    await payload.updateGlobal({
      slug: 'navigazione',
      data: { inEvidenza: [{ etichetta: 'Open Days', tipo: 'percorso', url: '/open-days' }] },
      user: admin,
      overrideAccess: false,
    })
    const pubblico = await payload.findGlobal({ slug: 'navigazione', overrideAccess: false })
    expect(pubblico.inEvidenza?.map((v) => v.etichetta)).toEqual(['Open Days'])
  })

  it('redazione e segreteria non modificano il menu', async () => {
    for (const user of [redazione, segreteria]) {
      await expect(
        payload.updateGlobal({
          slug: 'navigazione',
          data: { inEvidenza: [] },
          user,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
  })

  it('un indirizzo del sito deve iniziare con /', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigazione',
        data: { inEvidenza: [{ etichetta: 'Esterno', tipo: 'percorso', url: '//evil.example' }] },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
