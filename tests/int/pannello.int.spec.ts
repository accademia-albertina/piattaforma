// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { filtroPannello, SEZIONI_PANNELLO, vedeSezione } from '@/access/pannello'
import type { User } from '@/payload-types'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const ORA = new Date().toISOString()

const utente = (email: string, roles: User['roles']) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

const visibili = (roles: User['roles']) => SEZIONI_PANNELLO.filter((s) => vedeSezione({ roles }, s))

describe('Pannello: cosa vede ogni ruolo', () => {
  let docente: User
  let altroDocente: User
  let segreteria: User
  let vicedirezione: User
  let redazione: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.pannello@' } } })
    // Il primo utente di un database vuoto diventa admin: lo creiamo apposta
    await utente('admin.pannello@albertina.academy', ['admin'])
    docente = await utente('docente.pannello@albertina.academy', ['docente'])
    altroDocente = await utente('altro.pannello@albertina.academy', ['docente'])
    segreteria = await utente('segreteria.pannello@albertina.academy', ['segreteria'])
    vicedirezione = await utente('vice.pannello@albertina.academy', ['vicedirezione'])
    redazione = await utente('redazione.pannello@albertina.academy', ['redazione'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'avvisi', where: { titolo: { like: 'Pannello' } } })
    await payload.delete({ collection: 'media', where: { filename: { like: 'pannello' } } })
    await payload.delete({ collection: 'users', where: { email: { like: '.pannello@' } } })
  })

  it('ogni ruolo vede solo le sezioni della tabella approvata', () => {
    expect(visibili(['docente'])).toEqual([
      'avvisi',
      'media',
      'corsi',
      'docenti',
      'iscrizioni-corsi',
      'appelli',
      'iscrizioni-esami',
    ])
    expect(visibili(['segreteria'])).toEqual([
      'pagine',
      'avvisi',
      'media',
      'calendari',
      'finestre-iscrizione',
      'iscrizioni-corsi',
      'appelli',
      'iscrizioni-esami',
      'changelog',
    ])
    expect(visibili(['vicedirezione'])).not.toContain('users')
    expect(visibili(['vicedirezione'])).not.toContain('navigazione')
    expect(visibili(['vicedirezione'])).not.toContain('pubblicazioni')
    expect(visibili(['redazione'])).not.toContain('scuole')
    expect(visibili(['admin'])).toEqual([...SEZIONI_PANNELLO])
    expect(visibili(['studente'])).toEqual([])
  })

  it('il docente vede in elenco solo i suoi corsi, profilo, avvisi e file', () => {
    expect(filtroPannello(docente, 'corsi')).toEqual({ 'docenti.account': { equals: docente.id } })
    expect(filtroPannello(docente, 'docenti')).toEqual({ account: { equals: docente.id } })
    expect(filtroPannello(docente, 'avvisi')).toEqual({ autore: { equals: docente.id } })
    expect(filtroPannello(segreteria, 'pagine')).toEqual({ ufficiEditori: { in: ['segreteria'] } })
    expect(filtroPannello(segreteria, 'avvisi')).toBeNull()
    expect(filtroPannello(vicedirezione, 'corsi')).toBeNull()
    expect(filtroPannello(docente, 'iscrizioni-corsi')).toEqual({
      'corso.docenti.account': { equals: docente.id },
    })
    expect(filtroPannello(segreteria, 'iscrizioni-corsi')).toBeNull()
    expect(filtroPannello(segreteria, 'corsi')).toBeNull()
  })

  it('il docente modifica solo gli avvisi che ha scritto lui', async () => {
    const crea = (user: User, titolo: string) =>
      payload.create({
        collection: 'avvisi',
        data: { titolo, pubblicatoIl: ORA, categorie: ['lezioni'] },
        user,
        overrideAccess: false,
      })
    const suo = await crea(docente, 'Pannello lezione mia')
    const altrui = await crea(altroDocente, 'Pannello lezione altrui')
    await payload.update({
      collection: 'avvisi',
      id: suo.id,
      data: { titolo: 'Pannello lezione mia aggiornata' },
      user: docente,
      overrideAccess: false,
    })
    await expect(
      payload.update({
        collection: 'avvisi',
        id: altrui.id,
        data: { titolo: 'Pannello modificato da altri' },
        user: docente,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('i file ricordano chi li ha caricati e il docente tocca solo i suoi', async () => {
    const PNG = await sharp({
      create: { width: 40, height: 30, channels: 3, background: '#203038' },
    })
      .png()
      .toBuffer()
    const carica = (user: User, nome: string) =>
      payload.create({
        collection: 'media',
        data: { alt: 'Prova' },
        file: { data: PNG, name: nome, mimetype: 'image/png', size: PNG.length },
        user,
        overrideAccess: false,
      })
    const mio = await carica(docente, 'pannello-mio.png')
    const altrui = await carica(segreteria, 'pannello-altrui.png')
    const autore = (m: typeof mio) => (typeof m.creatoDa === 'object' ? m.creatoDa?.id : m.creatoDa)
    expect(autore(mio)).toBe(docente.id)
    expect(autore(altrui)).toBe(segreteria.id)
    await expect(
      payload.update({
        collection: 'media',
        id: altrui.id,
        data: { alt: 'Cambiato' },
        user: docente,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const { totalDocs } = await payload.count({
      collection: 'media',
      where: filtroPannello(docente, 'media')!,
    })
    expect(totalDocs).toBe(1)
  })

  it('i permessi seguono la tabella: Press, Scuole e Albo', async () => {
    await expect(
      payload.create({
        collection: 'pubblicazioni',
        data: { titolo: 'Pannello volume' } as never,
        user: vicedirezione,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const { docs } = await payload.find({ collection: 'scuole', limit: 1, depth: 0 })
    if (docs[0]) {
      await expect(
        payload.update({
          collection: 'scuole',
          id: docs[0].id,
          data: { sigla: 'X' },
          user: redazione,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
  })
})
