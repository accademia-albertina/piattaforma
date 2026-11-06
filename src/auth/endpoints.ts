/**
 * Endpoint dell'accesso con Google, sotto /api/users:
 *   GET /api/users/google           → manda a Google (con ?dopo=/percorso facoltativo)
 *   GET /api/users/google/callback  → torna da Google, controlla l'account e apre la sessione
 */
import { randomBytes } from 'node:crypto'

import type { Endpoint, Payload, PayloadRequest } from 'payload'

import { canAccessBackend } from '@/access/roles'
import type { User } from '@/payload-types'

import {
  AccessoNegato,
  COOKIE_STATO,
  destinazioneSicura,
  nuovoStato,
  PERCORSO_CALLBACK,
  type ProfiloGoogle,
  scambiaCodice,
  ssoAttivo,
  urlAutorizzazione,
} from './google'
import { apriSessione } from './sessione'

const DIECI_MINUTI = 10 * 60
export const PAGINA_ATTESA = '/accesso-in-attesa'

function origine(req: PayloadRequest) {
  return process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url ?? 'http://localhost').origin
}

const sicuro = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '')

function vai(url: string, cookies: string[] = []) {
  const headers = new Headers({ Location: url, 'Cache-Control': 'no-store' })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 302, headers })
}

const errore = (req: PayloadRequest, motivo: string) =>
  vai(`${origine(req)}/admin/login?errore=${motivo}`, [
    `${COOKIE_STATO}=; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=0${sicuro()}`,
  ])

/**
 * Chi non ha ancora un ruolo ed è nell'elenco Docenti (stessa email, profilo libero) diventa
 * Docente e viene collegato al proprio profilo. Il resto del personale resta in attesa:
 * il ruolo lo assegna un amministratore.
 */
export async function abbinaDocente(payload: Payload, utente: User, req?: PayloadRequest) {
  if (utente.roles?.length) return utente
  const { docs } = await payload.find({
    collection: 'docenti',
    where: {
      and: [
        { email: { equals: utente.email.toLowerCase() } },
        { attivo: { equals: true } },
        { account: { exists: false } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const docente = docs[0]
  if (!docente) return utente
  await payload.update({
    collection: 'docenti',
    id: docente.id,
    data: { account: utente.id },
    overrideAccess: true,
    req,
  })
  return (await payload.update({
    collection: 'users',
    id: utente.id,
    data: { roles: ['docente'] },
    overrideAccess: true,
    req,
  })) as User
}

/** Senza ruoli: account creato ma non ancora abilitato da un amministratore. */
export const inAttesa = (utente: Pick<User, 'roles'>) => !utente.roles?.length

/** Trova l'utente con quell'email o lo crea; i ruoli iniziali vengono dall'email (vedi Users). */
export async function trovaOCreaUtente(
  payload: Payload,
  profilo: ProfiloGoogle,
  req?: PayloadRequest,
) {
  return abbinaDocente(payload, await trovaOCreaSemplice(payload, profilo, req), req)
}

async function trovaOCreaSemplice(payload: Payload, profilo: ProfiloGoogle, req?: PayloadRequest) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: profilo.email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const esistente = docs[0] as User | undefined
  if (esistente) {
    // Nome e cognome da Google solo se mancano: quelli scritti nel pannello restano
    if ((!esistente.nome && profilo.nome) || (!esistente.cognome && profilo.cognome)) {
      return (await payload.update({
        collection: 'users',
        id: esistente.id,
        data: {
          nome: esistente.nome || profilo.nome,
          cognome: esistente.cognome || profilo.cognome,
        },
        overrideAccess: true,
        req,
      })) as User
    }
    return esistente
  }
  return (await payload.create({
    collection: 'users',
    data: {
      email: profilo.email,
      nome: profilo.nome,
      cognome: profilo.cognome,
      // Password casuale e mai mostrata: con Google non serve
      password: randomBytes(32).toString('base64url'),
    },
    overrideAccess: true,
    req,
  })) as User
}

export const endpointsGoogle: Endpoint[] = [
  {
    path: '/google',
    method: 'get',
    handler: async (req) => {
      if (!ssoAttivo()) return errore(req, 'non-attivo')
      const dopo = destinazioneSicura(new URL(req.url ?? '', 'http://x').searchParams.get('dopo'))
      const s = nuovoStato(dopo)
      const valore = Buffer.from(JSON.stringify(s)).toString('base64url')
      return vai(urlAutorizzazione({ ...s, redirectUri: origine(req) + PERCORSO_CALLBACK }), [
        `${COOKIE_STATO}=${valore}; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=${DIECI_MINUTI}${sicuro()}`,
      ])
    },
  },
  {
    path: '/google/callback',
    method: 'get',
    handler: async (req) => {
      if (!ssoAttivo()) return errore(req, 'non-attivo')
      const qs = new URL(req.url ?? '', 'http://x').searchParams
      if (qs.get('error')) return errore(req, 'annullato')

      let salvato: { stato?: string; verificatore?: string; dopo?: string } = {}
      try {
        const grezzo = req.headers
          .get('cookie')
          ?.split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${COOKIE_STATO}=`))
          ?.slice(COOKIE_STATO.length + 1)
        if (grezzo) salvato = JSON.parse(Buffer.from(grezzo, 'base64url').toString('utf8'))
      } catch {
        // cookie illeggibile: trattato come scaduto
      }
      const codice = qs.get('code')
      if (!codice || !salvato.stato || !salvato.verificatore || qs.get('state') !== salvato.stato) {
        return errore(req, 'scaduto')
      }

      try {
        const profilo = await scambiaCodice({
          codice,
          verificatore: salvato.verificatore,
          redirectUri: origine(req) + PERCORSO_CALLBACK,
        })
        const utente = await trovaOCreaUtente(req.payload, profilo, req)
        const cookie = await apriSessione(req.payload, utente, req)
        let dopo = destinazioneSicura(salvato.dopo)
        // Personale non ancora abilitato: pagina di attesa. Chi non ha il pannello (studenti) torna al sito.
        if (inAttesa(utente)) dopo = PAGINA_ATTESA
        else if (dopo.startsWith('/admin') && !canAccessBackend(utente)) dopo = '/'
        return vai(origine(req) + dopo, [
          cookie,
          `${COOKIE_STATO}=; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=0${sicuro()}`,
        ])
      } catch (e) {
        if (e instanceof AccessoNegato) return errore(req, e.motivo)
        req.payload.logger.error(`Accesso con Google non riuscito: ${(e as Error).message}`)
        return errore(req, 'token')
      }
    },
  },
]
