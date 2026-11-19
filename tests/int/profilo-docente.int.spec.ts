import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { User } from '@/payload-types'

let payload: Payload
let admin: User

const NUOVO = 'nuova.docente-prova@albertina.academy'
const ESISTENTE = 'profilo.esistente-prova@albertina.academy'
const ADMIN = 'admin.profilo-prova@albertina.academy'

const pulisci = async () => {
  await payload.delete({
    collection: 'docenti',
    where: { email: { in: [NUOVO, ESISTENTE] } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'users',
    where: { email: { in: [NUOVO, ESISTENTE, ADMIN] } },
    overrideAccess: true,
  })
}

describe('Profilo pubblico dei docenti aggiunti come utenti', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
    admin = await payload.create({
      collection: 'users',
      data: { email: ADMIN, password: 'Password-di-prova-1!', roles: ['admin'] },
      overrideAccess: true,
    })
  })

  afterAll(pulisci)

  it('crea il profilo, in servizio e collegato, quando si assegna il ruolo Docente', async () => {
    const u = await payload.create({
      collection: 'users',
      user: admin,
      data: { email: NUOVO, password: 'Password-di-prova-1!' },
      overrideAccess: true,
    })
    expect(
      (await payload.count({ collection: 'docenti', where: { email: { equals: NUOVO } } }))
        .totalDocs,
    ).toBe(0)

    await payload.update({
      collection: 'users',
      user: admin,
      id: u.id,
      data: { roles: ['docente'] },
      overrideAccess: true,
    })
    const { docs } = await payload.find({
      collection: 'docenti',
      where: { email: { equals: NUOVO } },
      depth: 0,
      overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ nome: 'Nuova', cognome: 'Docente-Prova', attivo: true })
    expect(docs[0].account).toBe(u.id)

    // Salvare di nuovo l'utente non crea un secondo profilo
    await payload.update({
      collection: 'users',
      user: admin,
      id: u.id,
      data: { roles: ['docente'], nome: 'Nuova' },
      overrideAccess: true,
    })
    expect(
      (await payload.count({ collection: 'docenti', where: { email: { equals: NUOVO } } }))
        .totalDocs,
    ).toBe(1)
  })

  it('non crea profili quando il ruolo arriva da import o script (senza utente)', async () => {
    const u = await payload.create({
      collection: 'users',
      data: {
        email: NUOVO.replace('nuova', 'script'),
        password: 'Password-di-prova-1!',
        roles: ['docente'],
      },
      overrideAccess: true,
    })
    expect(
      (await payload.count({ collection: 'docenti', where: { account: { equals: u.id } } }))
        .totalDocs,
    ).toBe(0)
    await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  })

  it('collega il profilo che esiste già con la stessa email, senza duplicarlo', async () => {
    const profilo = await payload.create({
      collection: 'docenti',
      data: { nome: 'Profilo', cognome: 'Esistente', email: ESISTENTE, attivo: true },
      overrideAccess: true,
    })
    const u = await payload.create({
      collection: 'users',
      user: admin,
      data: { email: ESISTENTE, password: 'Password-di-prova-1!', roles: ['docente'] },
      overrideAccess: true,
    })
    const { docs } = await payload.find({
      collection: 'docenti',
      where: { email: { equals: ESISTENTE } },
      depth: 0,
      overrideAccess: true,
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe(profilo.id)
    expect(docs[0].account).toBe(u.id)
  })
})
