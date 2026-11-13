// @vitest-environment node
import { getPayload, type EmailAdapter, Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { conRegistro } from '@/lib/email'
import { puliziaRegistroEmail } from '@/lib/registro-email'
import type { User } from '@/payload-types'

let payload: Payload
const PASSWORD = 'Password-di-prova-1!'
const MB = 1024 * 1024

const utente = (email: string, roles: User['roles']) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, roles } })

const ultima = async () =>
  (
    await payload.find({
      collection: 'email-inviate',
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]

/** Finto server SMTP: risponde come nodemailer o fallisce. */
const smtpFinto =
  (fallisce = false): EmailAdapter =>
  () => ({
    name: 'finto',
    defaultFromAddress: 'noreply@albertina.academy',
    defaultFromName: 'Accademia Albertina',
    sendEmail: async () => {
      if (fallisce) throw new Error('Invalid login: 535 Authentication failed')
      return { messageId: '<id-prova@turbo-smtp>', response: '250 OK' }
    },
  })

describe('Registro delle email inviate', () => {
  let admin: User
  let redazione: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.registro@' } } })
    admin = await utente('admin.registro@albertina.academy', ['admin'])
    redazione = await utente('redazione.registro@albertina.academy', ['redazione'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', where: { email: { like: '.registro@' } } })
    await payload.delete({
      collection: 'email-inviate',
      where: { destinatario: { like: 'registro' } },
      overrideAccess: true,
    })
  })

  it('registra un invio riuscito e l’indirizzo di prova a cui è andato', async () => {
    const adattatore = conRegistro(smtpFinto(), { soloA: 'new@albertina.academy' })({ payload })
    await adattatore.sendEmail({
      to: '12345t.registro@albertina.academy',
      subject: 'Iscrizione al corso Prova',
      text: 'Gentile Giulia,\n\nla tua iscrizione è registrata.',
    })
    const voce = await ultima()
    expect(voce.esito).toBe('inviata')
    expect(voce.destinatario).toBe('12345t.registro@albertina.academy')
    expect(voce.consegnataA).toBe('new@albertina.academy')
    expect(voce.idMessaggio).toBe('<id-prova@turbo-smtp>')
    expect(voce.testo).toContain('la tua iscrizione è registrata')
  })

  it('registra l’errore SMTP e lo rilancia', async () => {
    const adattatore = conRegistro(smtpFinto(true))({ payload })
    await expect(
      adattatore.sendEmail({ to: 'errore.registro@albertina.academy', subject: 'X', text: 'x' }),
    ).rejects.toThrow('535')
    const voce = await ultima()
    expect(voce.esito).toBe('errore')
    expect(voce.errore).toContain('Authentication failed')
  })

  it('senza SMTP non spedisce ma lo scrive nel registro', async () => {
    const adattatore = conRegistro(null)({ payload })
    await adattatore.sendEmail({ to: 'spento.registro@albertina.academy', subject: 'Y', text: 'y' })
    expect((await ultima()).esito).toBe('non-spedita')
  })

  it('cancella le voci più vecchie di 30 giorni', async () => {
    const vecchia = await payload.create({
      collection: 'email-inviate',
      data: { destinatario: 'vecchia.registro@albertina.academy', oggetto: 'Z', esito: 'inviata' },
      overrideAccess: true,
    })
    const recente = await ultima()
    const traDueMesi = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
    // La voce "vecchia" e quelle appena create hanno più di 30 giorni rispetto a traDueMesi
    expect(await puliziaRegistroEmail(payload, traDueMesi)).toBeGreaterThanOrEqual(2)
    const rimaste = await payload.find({
      collection: 'email-inviate',
      where: { id: { in: [vecchia.id, recente.id] } },
      overrideAccess: true,
    })
    expect(rimaste.totalDocs).toBe(0)
  })

  it('lo leggono solo gli admin; nessuno lo scrive o lo cancella dal pannello', async () => {
    await conRegistro(null)({ payload }).sendEmail({
      to: 'permessi.registro@albertina.academy',
      subject: 'P',
      text: 'p',
    })
    const perAdmin = await payload.find({
      collection: 'email-inviate',
      overrideAccess: false,
      user: admin,
    })
    expect(perAdmin.totalDocs).toBeGreaterThan(0)
    await expect(
      payload.find({ collection: 'email-inviate', overrideAccess: false, user: redazione }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'email-inviate',
        data: { destinatario: 'x', oggetto: 'x', esito: 'inviata' },
        overrideAccess: false,
        user: admin,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({
        collection: 'email-inviate',
        id: perAdmin.docs[0].id,
        overrideAccess: false,
        user: admin,
      }),
    ).rejects.toThrow()
  })
})

describe('Limite dei caricamenti', () => {
  let admin: User
  let redazione: User
  const creati: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { like: '.limite@' } } })
    admin = await utente('admin.limite@albertina.academy', ['admin'])
    redazione = await utente('redazione.limite@albertina.academy', ['redazione'])
  })

  afterAll(async () => {
    for (const id of creati) await payload.delete({ collection: 'media', id })
    await payload.delete({ collection: 'users', where: { email: { like: '.limite@' } } })
  })

  const png = () =>
    sharp({ create: { width: 40, height: 30, channels: 3, background: '#a23130' } })
      .png()
      .toBuffer()

  it('rifiuta un’immagine oltre 20 MB dalla redazione', async () => {
    const data = await png()
    await expect(
      payload.create({
        collection: 'media',
        data: {},
        file: { data, name: 'enorme.png', mimetype: 'image/png', size: 25 * MB },
        overrideAccess: false,
        user: redazione,
      }),
    ).rejects.toThrow(/massimo è 20 MB/)
  })

  it('accetta lo stesso file dall’admin', async () => {
    const data = await png()
    const media = await payload.create({
      collection: 'media',
      data: {},
      file: { data, name: 'enorme-admin.png', mimetype: 'image/png', size: 25 * MB },
      overrideAccess: false,
      user: admin,
    })
    creati.push(media.id)
    expect(media.id).toBeTruthy()
  })
})
