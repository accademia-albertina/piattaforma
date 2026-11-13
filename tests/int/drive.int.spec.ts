// @vitest-environment node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { adattatoreDrive, CAMPO_DRIVE } from '@/lib/drive/adattatore'
import { leggiStato, rimuoviCollegamento, salvaCollegamento } from '@/lib/drive/connessione'
import { endpointsDrive } from '@/lib/drive/endpoints'
import type { User } from '@/payload-types'

let payload: Payload
let admin: User
let docente: User
const PASSWORD = 'Password-di-prova-1!'
const ENV = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'DRIVE_ID', 'DRIVE_CACHE_DIR']
const creati: number[] = []

/** Finto Google Drive: registra le chiamate e risponde come l'API v3. */
const chiamate: { metodo: string; url: string }[] = []
function fintoDrive(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input)
  const metodo = init?.method ?? 'GET'
  chiamate.push({ metodo, url })
  const json = (d: unknown) =>
    new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json' } })
  if (url.startsWith('https://www.googleapis.com/drive/v3/files?') && metodo === 'GET')
    return json({ files: [] })
  if (url.startsWith('https://www.googleapis.com/drive/v3/files?') && metodo === 'POST')
    return json({ id: 'cartella-media' })
  if (url.startsWith('https://www.googleapis.com/upload/')) {
    return new Response(null, { headers: { location: 'https://upload.prova/sessione' } })
  }
  if (url === 'https://upload.prova/sessione') return json({ id: 'file-drive-1' })
  if (url.includes('/files/file-drive-1?alt=media')) return new Response('immagine-da-drive')
  if (metodo === 'PATCH') return json({ id: 'x' })
  return new Response('non previsto', { status: 500 })
}

const ddoc = (d: unknown) => d as { id: number; filename: string; [CAMPO_DRIVE]?: string | null }

describe('Google Drive: caricamenti, file serviti e permessi', () => {
  let req: PayloadRequest
  let cache: string
  let adattatore: ReturnType<typeof adattatoreDrive>

  const pulisci = async () => {
    await payload.delete({ collection: 'users', where: { email: { like: 'drive-prova' } } })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
    admin = await payload.create({
      collection: 'users',
      data: { email: 'admin.drive-prova@albertina.academy', password: PASSWORD, roles: ['admin'] },
    })
    docente = await payload.create({
      collection: 'users',
      data: { email: 'doc.drive-prova@albertina.academy', password: PASSWORD, roles: ['docente'] },
    })
    cache = await fs.mkdtemp(path.join(os.tmpdir(), 'drive-int-'))
    Object.assign(process.env, {
      GOOGLE_DRIVE_CLIENT_ID: 'client',
      GOOGLE_DRIVE_CLIENT_SECRET: 'segreto',
      DRIVE_ID: 'cartella-radice',
      DRIVE_CACHE_DIR: cache,
    })
    req = await createLocalReq({}, payload)
    adattatore = adattatoreDrive({ collection: payload.collections.media.config })
  })

  beforeEach(() => {
    chiamate.length = 0
    vi.stubGlobal('fetch', vi.fn(fintoDrive))
  })

  afterAll(async () => {
    vi.unstubAllGlobals()
    await rimuoviCollegamento(payload)
    for (const id of creati) await payload.delete({ collection: 'media', id })
    await pulisci()
    await fs.rm(cache, { recursive: true, force: true })
    for (const v of ENV) delete process.env[v]
  })

  async function nuovoFile() {
    const png = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#a23130' },
    })
      .png()
      .toBuffer()
    const m = ddoc(
      await payload.create({
        collection: 'media',
        data: { alt: 'Prova Drive' },
        file: { data: png, name: 'prova-drive.png', mimetype: 'image/png', size: png.length },
      }),
    )
    creati.push(m.id)
    return { m, png }
  }

  it('senza collegamento il file resta sul disco', async () => {
    const { m, png } = await nuovoFile()
    const r = await adattatore.handleUpload({
      clientUploadContext: undefined,
      collection: payload.collections.media.config,
      data: m,
      file: { buffer: png, filename: m.filename, filesize: png.length, mimeType: 'image/webp' },
      req,
      storageFilePath: m.filename,
    })
    expect(r).toEqual({ [CAMPO_DRIVE]: null })
    expect(chiamate).toHaveLength(0)
    // Il file locale lo serve Payload: l'adattatore non risponde
    expect(
      await adattatore.staticHandler(req, {
        params: { collection: 'media', filename: m.filename },
      }),
    ).toBeUndefined()
  })

  it('collegato: carica nella sottocartella media, serve dalla cache e cestina', async () => {
    await salvaCollegamento(payload, {
      email: 'noreply@albertina.academy',
      refreshToken: 'refresh-di-prova',
      accessToken: 'accesso-di-prova',
      scade: Date.now() + 3600_000,
      da: admin.email,
    })
    // Il token nel database è cifrato
    const stato = await leggiStato(payload)
    expect(stato.tokenCifrato).toBeTruthy()
    expect(stato.tokenCifrato).not.toContain('refresh-di-prova')

    const { m, png } = await nuovoFile()
    const r = await adattatore.handleUpload({
      clientUploadContext: undefined,
      collection: payload.collections.media.config,
      data: m,
      file: { buffer: png, filename: m.filename, filesize: png.length, mimeType: 'image/webp' },
      req,
      storageFilePath: m.filename,
    })
    expect(r).toEqual({ [CAMPO_DRIVE]: 'file-drive-1' })
    // Cartella "media" creata dentro DRIVE_ID, file caricato lì, tutto con supportsAllDrives
    const creaCartella = chiamate.find(
      (c) => c.metodo === 'POST' && c.url.includes('/drive/v3/files?'),
    )
    expect(creaCartella?.url).toContain('supportsAllDrives=true')
    expect(
      chiamate.some((c) => c.url.includes('uploadType=resumable&supportsAllDrives=true')),
    ).toBe(true)
    expect((await leggiStato(payload)).cartellaMedia).toBe('cartella-media')

    await payload.update({
      collection: 'media',
      id: m.id,
      data: { [CAMPO_DRIVE]: 'file-drive-1' } as never,
      context: { skipCloudStorage: true },
    })
    const letto = ddoc(await payload.findByID({ collection: 'media', id: m.id }))
    expect(letto[CAMPO_DRIVE]).toBe('file-drive-1')
    // Il testo alternativo non cambia quando si salva solo l'ID di Drive
    expect((letto as unknown as { alt: string }).alt).toBe('Prova Drive')

    chiamate.length = 0
    const params = { collection: 'media', filename: m.filename }
    const prima = (await adattatore.staticHandler(req, { params })) as Response
    expect(prima.status).toBe(200)
    expect(await prima.text()).toBe('immagine-da-drive')
    expect(prima.headers.get('cache-control')).toContain('max-age=86400')
    expect(prima.headers.get('content-type')).toBe('image/webp')
    const seconda = (await adattatore.staticHandler(req, { params })) as Response
    expect(await seconda.text()).toBe('immagine-da-drive')
    // Scaricato da Drive una volta sola
    expect(chiamate.filter((c) => c.url.includes('alt=media'))).toHaveLength(1)

    await adattatore.handleDelete({
      collection: payload.collections.media.config,
      doc: letto as never,
      filename: m.filename,
      req,
      storageFilePath: m.filename,
    })
    expect(
      chiamate.some((c) => c.metodo === 'PATCH' && c.url.includes('/files/file-drive-1?')),
    ).toBe(true)
  })

  it('nessuno legge o modifica il collegamento dall’API, nemmeno un admin', async () => {
    await expect(
      payload.findGlobal({ slug: 'drive-connessione', overrideAccess: false, user: admin }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'drive-connessione',
        data: { email: 'altro@albertina.academy' },
        overrideAccess: false,
        user: admin,
      }),
    ).rejects.toThrow()
  })

  it('gli endpoint sono solo per gli amministratori', async () => {
    const avvia = endpointsDrive.find((e) => e.path === '/drive/oauth/avvia')!
    const scollega = endpointsDrive.find((e) => e.path === '/drive/scollega')!
    const conUtente = (user: User | null) =>
      ({
        ...req,
        user,
        url: 'http://localhost/api/drive/oauth/avvia',
        headers: new Headers(),
      }) as PayloadRequest

    expect((await avvia.handler(conUtente(null))).status).toBe(302)
    expect((await avvia.handler(conUtente(docente))).status).toBe(403)
    expect((await scollega.handler(conUtente(docente))).status).toBe(403)

    const r = await avvia.handler(conUtente(admin))
    const google = new URL(r.headers.get('location')!)
    expect(google.hostname).toBe('accounts.google.com')
    expect(google.searchParams.get('redirect_uri')).toBe(
      'http://localhost/api/drive/oauth/callback',
    )
    expect(r.headers.get('set-cookie')).toContain('HttpOnly')
  })

  it('il ritorno da Google senza il cookie di stato non collega nulla', async () => {
    const callback = endpointsDrive.find((e) => e.path === '/drive/oauth/callback')!
    const r = await callback.handler({
      ...req,
      user: null,
      url: 'http://localhost/api/drive/oauth/callback?code=abc&state=xyz',
      headers: new Headers(),
    } as PayloadRequest)
    expect(await r.text()).toContain('errore=scaduto')
    expect(chiamate).toHaveLength(0)
  })
})
