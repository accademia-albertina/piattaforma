/**
 * Endpoint del collegamento a Google Drive (solo amministratori):
 *   GET  /api/drive/oauth/avvia     → manda a Google per entrare come noreply@
 *   GET  /api/drive/oauth/callback  → torna da Google, salva il refresh token cifrato
 *   POST /api/drive/scollega        → revoca il permesso e cancella il token
 *   POST /api/drive/sposta          → sposta su Drive i file ancora sul disco
 * Ogni endpoint torna a /admin/drive con ?esito= o ?errore= (messaggi nella pagina).
 */
import type { Endpoint, PayloadRequest } from 'payload'

import { isAdmin } from '@/access/roles'

import {
  accountDrive,
  COOKIE_STATO_DRIVE,
  driveConfigurato,
  ErroreDrive,
  idCartellaRadice,
  nuovoStatoDrive,
  PERCORSO_CALLBACK_DRIVE,
  revocaToken,
  scambiaCodiceDrive,
  urlAutorizzazioneDrive,
} from './api'
import {
  cartellaMedia,
  driveCollegato,
  rimuoviCollegamento,
  salvaCollegamento,
} from './connessione'
import { avviaSpostamento } from './sposta'

const DIECI_MINUTI = 10 * 60
const PAGINA = '/admin/drive'

const origine = (req: PayloadRequest) =>
  process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url ?? 'http://localhost').origin

const sicuro = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '')
const cancellaCookie = () =>
  `${COOKIE_STATO_DRIVE}=; Path=/api/drive/oauth; HttpOnly; SameSite=Lax; Max-Age=0${sicuro()}`

function torna(req: PayloadRequest, qs: string, cookies: string[] = []) {
  const headers = new Headers({
    Location: `${origine(req)}${PAGINA}?${qs}`,
    'Cache-Control': 'no-store',
  })
  for (const c of cookies) headers.append('Set-Cookie', c)
  // 303: dopo un POST il browser torna alla pagina con GET
  return new Response(null, { status: 303, headers })
}

const soloAdmin = (req: PayloadRequest) => {
  if (!req.user)
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/login?redirect=${PAGINA}` },
    })
  if (!isAdmin(req.user)) return new Response('Riservato agli amministratori', { status: 403 })
  if (!driveConfigurato()) return torna(req, 'errore=configurazione')
  return null
}

/**
 * Ritorno da Google: la catena di redirect parte da un altro sito, quindi anche /admin/drive
 * verrebbe aperta "cross-site" e Payload non riconoscerebbe la sessione. Una pagina ponte
 * dello stesso sito fa il passaggio finale come navigazione interna.
 */
function ponte(qs: string) {
  const dest = `${PAGINA}?${qs}`
  const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${dest}"><title>Google Drive</title><p><a href="${dest}">Torna al pannello</a></p></html>`
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': cancellaCookie(),
    },
  })
}

function leggiCookie(req: PayloadRequest) {
  try {
    const grezzo = req.headers
      .get('cookie')
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_STATO_DRIVE}=`))
      ?.slice(COOKIE_STATO_DRIVE.length + 1)
    if (!grezzo) return {}
    return JSON.parse(Buffer.from(grezzo, 'base64url').toString('utf8')) as {
      stato?: string
      verificatore?: string
      utente?: string | number
    }
  } catch {
    return {}
  }
}

export const endpointsDrive: Endpoint[] = [
  {
    path: '/drive/oauth/avvia',
    method: 'get',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      const s = { ...nuovoStatoDrive(), utente: req.user!.id }
      const valore = Buffer.from(JSON.stringify(s)).toString('base64url')
      const url = urlAutorizzazioneDrive({
        ...s,
        redirectUri: origine(req) + PERCORSO_CALLBACK_DRIVE,
      })
      return new Response(null, {
        status: 302,
        headers: {
          Location: url,
          'Cache-Control': 'no-store',
          'Set-Cookie': `${COOKIE_STATO_DRIVE}=${valore}; Path=/api/drive/oauth; HttpOnly; SameSite=Lax; Max-Age=${DIECI_MINUTI}${sicuro()}`,
        },
      })
    },
  },
  {
    path: '/drive/oauth/callback',
    method: 'get',
    // Il ritorno da Google è una navigazione da un altro sito: Payload non legge il cookie di
    // sessione (protezione CSRF). Chi ha avviato il collegamento si ricava dal cookie di stato
    // (HttpOnly, legato a stato e PKCE) e si ricontrolla che sia ancora amministratore.
    handler: async (req) => {
      if (!driveConfigurato()) return ponte('errore=configurazione')
      const qs = new URL(req.url ?? '', 'http://x').searchParams
      if (qs.get('error')) return ponte('errore=annullato')
      const salvato = leggiCookie(req)
      const codice = qs.get('code')
      if (
        !codice ||
        !salvato.stato ||
        !salvato.verificatore ||
        qs.get('state') !== salvato.stato ||
        salvato.utente === undefined
      ) {
        return ponte('errore=scaduto')
      }
      const admin = await req.payload
        .findByID({ collection: 'users', id: salvato.utente, depth: 0, overrideAccess: true })
        .catch(() => null)
      if (!admin || !isAdmin(admin)) return ponte('errore=scaduto')
      try {
        const t = await scambiaCodiceDrive({
          codice,
          verificatore: salvato.verificatore,
          redirectUri: origine(req) + PERCORSO_CALLBACK_DRIVE,
        })
        await salvaCollegamento(req.payload, { ...t, da: admin.email })
        // Prova subito: la cartella DRIVE_ID è raggiungibile e si può scrivere?
        const drive = await driveCollegato(req.payload)
        await drive!.info(idCartellaRadice())
        await cartellaMedia(req.payload, drive!)
        req.payload.logger.info(`Drive collegato come ${t.email} da ${admin.email}`)
        return ponte('esito=collegato')
      } catch (e) {
        const motivo =
          e instanceof ErroreDrive && ['account', 'permessi', 'token'].includes(e.message)
            ? e.message
            : e instanceof ErroreDrive && e.status === 404
              ? 'cartella'
              : 'google'
        req.payload.logger.error(
          `Collegamento a Drive non riuscito (${accountDrive()}): ${(e as Error).message}`,
        )
        return ponte(`errore=${motivo}`)
      }
    },
  },
  {
    path: '/drive/scollega',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      const token = await rimuoviCollegamento(req.payload)
      if (token) await revocaToken(token)
      req.payload.logger.info(`Drive scollegato da ${req.user!.email}`)
      return torna(req, 'esito=scollegato')
    },
  },
  {
    path: '/drive/sposta',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      if (!(await driveCollegato(req.payload))) return torna(req, 'errore=non-collegato')
      avviaSpostamento(req.payload)
      return torna(req, 'esito=sposta')
    },
  },
]
