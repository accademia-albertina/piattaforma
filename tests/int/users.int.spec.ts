import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload

const ADMIN = 'admin.test@albertina.academy'
const STUDENTE = '99999t@albertina.academy'
const DOCENTE = 'docente.test@albertina.academy'
const PASSWORD = 'Password-di-prova-1!'

describe('Utenti e permessi', () => {
  let admin: User
  let studente: User
  let docente: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: {} })
    admin = await payload.create({ collection: 'users', data: { email: ADMIN, password: PASSWORD } })
    studente = await payload.create({ collection: 'users', data: { email: STUDENTE, password: PASSWORD } })
    docente = await payload.create({ collection: 'users', data: { email: DOCENTE, password: PASSWORD } })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', where: {} })
  })

  it('il primo utente diventa amministratore', () => {
    expect(admin.roles).toEqual(['admin'])
  })

  it("assegna i ruoli di default dall'email", () => {
    expect(studente.roles).toEqual(['studente'])
    expect(docente.roles).toEqual([])
  })

  it('uno studente vede solo se stesso', async () => {
    const res = await payload.find({ collection: 'users', user: studente, overrideAccess: false })
    expect(res.docs.map((u) => u.email)).toEqual([STUDENTE])
  })

  it('un utente non può assegnarsi ruoli', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: studente.id,
      data: { roles: ['admin'] },
      user: studente,
      overrideAccess: false,
    })
    expect(updated.roles).toEqual(['studente'])
  })

  it("l'amministratore assegna ruoli", async () => {
    const updated = await payload.update({
      collection: 'users',
      id: docente.id,
      data: { roles: ['docente'] },
      user: admin,
      overrideAccess: false,
    })
    expect(updated.roles).toEqual(['docente'])
  })

  it('solo un amministratore crea utenti', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'altro.utente@albertina.academy', password: PASSWORD },
        user: { ...docente, roles: ['docente'] },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
