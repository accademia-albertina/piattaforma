import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { annoAccademicoCorrente, isAnnoAccademico } from '@/access/corsi'
import type { Corso, Docente, User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'

async function utente(email: string, roles: User['roles']) {
  return payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })
}

const rifiutato = (p: Promise<unknown>) => p.then(() => false).catch(() => true)

describe('Corsi e docenti: permessi', () => {
  let vicedirezione: User
  let segreteria: User
  let rossi: User
  let bianchi: User
  let profiloRossi: Docente
  let profiloBianchi: Docente
  let corsoRossi: Corso
  let corsoBianchi: Corso

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'corsi', where: {} })
    await payload.delete({ collection: 'docenti', where: {} })
    await payload.delete({ collection: 'users', where: {} })
    await utente('admin.corsi@albertina.academy', ['admin'])
    vicedirezione = await utente('vice.direzione@albertina.academy', ['vicedirezione'])
    segreteria = await utente('segreteria.corsi@albertina.academy', ['segreteria'])
    rossi = await utente('mario.rossi@albertina.academy', ['docente'])
    bianchi = await utente('anna.bianchi@albertina.academy', ['docente'])

    const crea = (data: Partial<Docente>) =>
      payload.create({
        collection: 'docenti',
        data: data as Docente,
        user: vicedirezione,
        overrideAccess: false,
      })
    profiloRossi = await crea({ nome: 'Mario', cognome: 'Rossi', account: rossi.id })
    profiloBianchi = await crea({ nome: 'Anna', cognome: 'Bianchi', account: bianchi.id })

    const corso = (titolo: string, docente: Docente) =>
      payload.create({
        collection: 'corsi',
        draft: false,
        data: {
          titolo,
          livelli: ['triennio'],
          annoAccademico: '2026/2027',
          docenti: [docente.id],
          _status: 'published',
        },
        user: vicedirezione,
        overrideAccess: false,
      })
    corsoRossi = await corso('Pittura 1', profiloRossi)
    corsoBianchi = await corso('Pittura 1', profiloBianchi)
  })

  afterAll(async () => {
    await payload.delete({ collection: 'corsi', where: {} })
    await payload.delete({ collection: 'docenti', where: {} })
    await payload.delete({ collection: 'users', where: {} })
  })

  it('la vicedirezione crea corsi omonimi con indirizzi diversi', () => {
    expect(corsoRossi.slug).toBe('pittura-1-triennio-2026-2027')
    expect(corsoBianchi.slug).toBe('pittura-1-triennio-2026-2027-2')
    expect(profiloRossi.nomeCompleto).toBe('Mario Rossi')
    expect(profiloRossi.slug).toBe('mario-rossi')
  })

  it('il docente aggiorna il programma del proprio corso', async () => {
    const aggiornato = await payload.update({
      collection: 'corsi',
      id: corsoRossi.id,
      data: { esoneri: true },
      user: rossi,
      overrideAccess: false,
    })
    expect(aggiornato.esoneri).toBe(true)
  })

  it('il docente non modifica il corso di un collega', async () => {
    expect(
      await rifiutato(
        payload.update({
          collection: 'corsi',
          id: corsoBianchi.id,
          data: { esoneri: true },
          user: rossi,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('il docente non cambia docenti, titolo o anno del proprio corso', async () => {
    const dopo = await payload.update({
      collection: 'corsi',
      id: corsoRossi.id,
      data: { docenti: [profiloBianchi.id], titolo: 'Altro', annoAccademico: '2020/2021' },
      user: rossi,
      overrideAccess: false,
    })
    const docenti = (dopo.docenti ?? []).map((d) => (typeof d === 'object' ? d.id : d))
    expect(docenti).toEqual([profiloRossi.id])
    expect(dopo.titolo).toBe('Pittura 1')
    expect(dopo.annoAccademico).toBe('2026/2027')
  })

  it('docente e segreteria non creano corsi', async () => {
    for (const user of [rossi, segreteria]) {
      expect(
        await rifiutato(
          payload.create({
            collection: 'corsi',
            data: {
              titolo: 'Nuovo',
              livelli: ['biennio'],
              annoAccademico: '2026/2027',
              docenti: [profiloRossi.id],
            },
            user,
            overrideAccess: false,
          }),
        ),
      ).toBe(true)
    }
  })

  it('il docente modifica il proprio profilo ma non il ruolo né quello di un collega', async () => {
    const dopo = await payload.update({
      collection: 'docenti',
      id: profiloRossi.id,
      data: { ricevimento: 'Martedì 10–11', ruolo: 'tempo-indeterminato', attivo: false },
      user: rossi,
      overrideAccess: false,
    })
    expect(dopo.ricevimento).toBe('Martedì 10–11')
    expect(dopo.ruolo).toBeFalsy()
    expect(dopo.attivo).toBe(true)
    expect(
      await rifiutato(
        payload.update({
          collection: 'docenti',
          id: profiloBianchi.id,
          data: { ricevimento: 'Mai' },
          user: rossi,
          overrideAccess: false,
        }),
      ),
    ).toBe(true)
  })

  it('il pubblico non vede le bozze né l’account collegato', async () => {
    await payload.create({
      collection: 'corsi',
      draft: true,
      data: {
        titolo: 'Corso in preparazione',
        livelli: ['biennio'],
        annoAccademico: '2026/2027',
        docenti: [profiloRossi.id],
      },
      user: vicedirezione,
      overrideAccess: false,
    })
    const corsi = await payload.find({ collection: 'corsi', overrideAccess: false })
    expect(corsi.docs.map((c) => c.titolo)).not.toContain('Corso in preparazione')
    const docente = await payload.findByID({
      collection: 'docenti',
      id: profiloRossi.id,
      overrideAccess: false,
    })
    expect(docente.account).toBeUndefined()
  })

  it('l’anno accademico ha il formato 2026/2027', () => {
    expect(annoAccademicoCorrente(new Date('2026-10-23'))).toBe('2026/2027')
    expect(annoAccademicoCorrente(new Date('2027-03-01'))).toBe('2026/2027')
    expect(isAnnoAccademico('2026/2027')).toBe(true)
    expect(isAnnoAccademico('2026/2028')).toBe(false)
    expect(isAnnoAccademico('2026-2027')).toBe(false)
  })
})
