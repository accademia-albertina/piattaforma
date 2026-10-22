import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

describe('Menu del sito: chi può modificarlo', () => {
  let redazione: User
  let segreteria: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.menu@' } } })
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

  it('la redazione modifica il menu e il pubblico lo legge', async () => {
    await payload.updateGlobal({
      slug: 'navigazione',
      data: { inEvidenza: [{ etichetta: 'Open Days', tipo: 'percorso', url: '/open-days' }] },
      user: redazione,
      overrideAccess: false,
    })
    const pubblico = await payload.findGlobal({ slug: 'navigazione', overrideAccess: false })
    expect(pubblico.inEvidenza?.map((v) => v.etichetta)).toEqual(['Open Days'])
  })

  it('la segreteria non modifica il menu', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigazione',
        data: { inEvidenza: [] },
        user: segreteria,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('un indirizzo del sito deve iniziare con /', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigazione',
        data: { inEvidenza: [{ etichetta: 'Esterno', tipo: 'percorso', url: '//evil.example' }] },
        user: redazione,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
