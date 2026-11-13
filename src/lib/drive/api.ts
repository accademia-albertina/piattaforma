/**
 * Google Drive per i file caricati dal pannello: OAuth (account noreply@) e chiamate REST v3.
 * Nessuna libreria googleapis (pesa decine di MB): bastano fetch e jose.
 *
 * DRIVE_ID è l'ID della cartella padre: una cartella del Mio Drive di noreply@ oppure un
 * Drive condiviso (il suo ID vale anche come cartella radice). Tutte le chiamate usano
 * supportsAllDrives=true, così per passare al Drive condiviso basta cambiare l'ID.
 */
import { createHash, randomBytes } from 'node:crypto'

import { createRemoteJWKSet, jwtVerify } from 'jose'

import { ALLOWED_DOMAIN } from '@/access/roles'

const AUTORIZZA = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const REVOCA = 'https://oauth2.googleapis.com/revoke'
const API = 'https://www.googleapis.com/drive/v3'
const CARICA = 'https://www.googleapis.com/upload/drive/v3/files'
const CHIAVI = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export const SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive'
export const PERCORSO_CALLBACK_DRIVE = '/api/drive/oauth/callback'
export const COOKIE_STATO_DRIVE = 'albertina-drive'
export const TIPO_CARTELLA = 'application/vnd.google-apps.folder'

/** L'unico account che può collegare Drive: la casella di servizio dell'Accademia. */
export const accountDrive = () =>
  (process.env.DRIVE_ACCOUNT || `noreply@${ALLOWED_DOMAIN}`).trim().toLowerCase()

export const driveConfigurato = () =>
  Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.DRIVE_ID,
  )

export const idCartellaRadice = () => process.env.DRIVE_ID?.trim() ?? ''

export class ErroreDrive extends Error {
  constructor(
    messaggio: string,
    public status = 0,
    /** true se il collegamento non vale più (token revocato o scaduto): serve ricollegare. */
    public scollegato = false,
  ) {
    super(messaggio)
  }
}

const base64url = (b: Buffer) => b.toString('base64url')

export function nuovoStatoDrive() {
  return { stato: base64url(randomBytes(24)), verificatore: base64url(randomBytes(48)) }
}

export function urlAutorizzazioneDrive(o: {
  stato: string
  verificatore: string
  redirectUri: string
}) {
  const url = new URL(AUTORIZZA)
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
    redirect_uri: o.redirectUri,
    response_type: 'code',
    scope: `openid email ${SCOPE_DRIVE}`,
    state: o.stato,
    code_challenge: base64url(createHash('sha256').update(o.verificatore).digest()),
    code_challenge_method: 'S256',
    // offline + consent: Google restituisce sempre il refresh token, anche ai collegamenti successivi
    access_type: 'offline',
    prompt: 'consent select_account',
    login_hint: accountDrive(),
    hd: ALLOWED_DOMAIN,
  }).toString()
  return url.toString()
}

type RispostaToken = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  id_token?: string
  scope?: string
  error?: string
}

/** Scambia il codice di Google: controlla account e permessi e restituisce il refresh token. */
export async function scambiaCodiceDrive(o: {
  codice: string
  verificatore: string
  redirectUri: string
}) {
  const r = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: o.codice,
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      redirect_uri: o.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: o.verificatore,
    }),
  })
  const t = (await r.json().catch(() => ({}))) as RispostaToken
  if (!r.ok || !t.id_token || !t.access_token) throw new ErroreDrive('token', r.status)
  let email: string
  try {
    const { payload } = await jwtVerify(t.id_token, CHIAVI, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_DRIVE_CLIENT_ID,
    })
    email = typeof payload.email === 'string' ? payload.email.toLowerCase() : ''
  } catch {
    throw new ErroreDrive('token')
  }
  if (email !== accountDrive()) throw new ErroreDrive('account')
  // Se nella schermata di Google si toglie la spunta su Drive il permesso manca
  if (!t.scope?.split(' ').includes(SCOPE_DRIVE)) throw new ErroreDrive('permessi')
  if (!t.refresh_token) throw new ErroreDrive('token')
  return {
    email,
    refreshToken: t.refresh_token,
    accessToken: t.access_token,
    scade: Date.now() + (t.expires_in ?? 3600) * 1000,
  }
}

/** Nuovo access token (dura un'ora) dal refresh token. */
export async function rinnovaToken(refreshToken: string) {
  const r = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const t = (await r.json().catch(() => ({}))) as RispostaToken
  if (!r.ok || !t.access_token) {
    // invalid_grant: token revocato, password cambiata o account sospeso
    throw new ErroreDrive(
      `rinnovo token: ${t.error ?? r.status}`,
      r.status,
      t.error === 'invalid_grant',
    )
  }
  return { accessToken: t.access_token, scade: Date.now() + (t.expires_in ?? 3600) * 1000 }
}

/** Revoca il permesso dato da noreply@ (pulsante "Scollega"). Errori ignorati. */
export async function revocaToken(token: string) {
  await fetch(REVOCA, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  }).catch(() => undefined)
}

export type FileDrive = { id: string; name: string; mimeType: string; driveId?: string }

/** Chiamate all'API Drive con un access token valido. */
export function clientDrive(token: () => Promise<string>) {
  async function chiama(url: string, init: RequestInit = {}) {
    const r = await fetch(url, {
      ...init,
      headers: { ...init.headers, authorization: `Bearer ${await token()}` },
    })
    if (!r.ok) {
      const testo = await r.text().catch(() => '')
      throw new ErroreDrive(`Drive ${r.status}: ${testo.slice(0, 300)}`, r.status)
    }
    return r
  }
  const tutti = 'supportsAllDrives=true'

  return {
    /** Nome della cartella (o del Drive condiviso) DRIVE_ID: serve anche a verificare l'accesso. */
    async info(id: string): Promise<FileDrive> {
      const r = await chiama(
        `${API}/files/${encodeURIComponent(id)}?${tutti}&fields=id,name,mimeType,driveId`,
      )
      return r.json()
    },

    /** Sottocartella con quel nome dentro `padre`, creata se manca. */
    async cartella(nome: string, padre: string): Promise<string> {
      const q = `'${padre.replace(/'/g, "\\'")}' in parents and name = '${nome.replace(/'/g, "\\'")}' and mimeType = '${TIPO_CARTELLA}' and trashed = false`
      const elenco = await chiama(
        `${API}/files?${tutti}&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=1&fields=files(id)&q=${encodeURIComponent(q)}`,
      )
      const { files } = (await elenco.json()) as { files: { id: string }[] }
      if (files[0]) return files[0].id
      const nuova = await chiama(`${API}/files?${tutti}&fields=id`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: nome, mimeType: TIPO_CARTELLA, parents: [padre] }),
      })
      return ((await nuova.json()) as { id: string }).id
    },

    /** Caricamento "resumable": funziona anche per PDF grandi. Restituisce l'ID del file. */
    async carica(o: {
      nome: string
      mimeType: string
      dati: Buffer
      padre: string
    }): Promise<string> {
      const avvio = await chiama(`${CARICA}?uploadType=resumable&${tutti}&fields=id`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=UTF-8',
          'x-upload-content-type': o.mimeType,
          'x-upload-content-length': String(o.dati.length),
        },
        body: JSON.stringify({ name: o.nome, mimeType: o.mimeType, parents: [o.padre] }),
      })
      const sessione = avvio.headers.get('location')
      if (!sessione) throw new ErroreDrive('Drive: manca l’indirizzo di caricamento')
      const r = await fetch(sessione, {
        method: 'PUT',
        headers: { 'content-type': o.mimeType, 'content-length': String(o.dati.length) },
        body: new Uint8Array(o.dati),
      })
      if (!r.ok) throw new ErroreDrive(`Drive caricamento ${r.status}`, r.status)
      return ((await r.json()) as { id: string }).id
    },

    /** Contenuto del file (risposta da leggere in streaming). */
    scarica(id: string) {
      return chiama(`${API}/files/${encodeURIComponent(id)}?alt=media&${tutti}`)
    },

    /** Nel cestino, non eliminato: si recupera da Drive per 30 giorni. */
    async cestina(id: string) {
      try {
        await chiama(`${API}/files/${encodeURIComponent(id)}?${tutti}&fields=id`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ trashed: true }),
        })
      } catch (e) {
        if (e instanceof ErroreDrive && e.status === 404) return
        throw e
      }
    },
  }
}

export type ClientDrive = ReturnType<typeof clientDrive>
