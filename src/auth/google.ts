/**
 * Accesso con Google Workspace (@albertina.academy), flusso OAuth 2.0 / OpenID Connect
 * "authorization code" con PKCE. Nessuna libreria esterna oltre a jose (già usata da Payload).
 *
 * Variabili d'ambiente: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET (credenziale "Applicazione web"
 * nella Google Cloud Console dell'Accademia). Se mancano, il pulsante non compare.
 */
import { createHash, randomBytes } from 'node:crypto'

import { createRemoteJWKSet, jwtVerify } from 'jose'

import { ALLOWED_DOMAIN, classifyEmail } from '@/access/roles'

const AUTORIZZA = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const CHIAVI = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const EMITTENTI = ['https://accounts.google.com', 'accounts.google.com']

export const COOKIE_STATO = 'albertina-sso'
export const PERCORSO_CALLBACK = '/api/users/google/callback'

export const ssoAttivo = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

const base64url = (b: Buffer) => b.toString('base64url')

/** Stato e verificatore PKCE, da tenere in un cookie fino al ritorno da Google. */
export function nuovoStato(dopo: string) {
  return { stato: base64url(randomBytes(24)), verificatore: base64url(randomBytes(48)), dopo }
}

export function urlAutorizzazione(o: { stato: string; verificatore: string; redirectUri: string }) {
  const sfida = base64url(createHash('sha256').update(o.verificatore).digest())
  const url = new URL(AUTORIZZA)
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: o.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: o.stato,
    code_challenge: sfida,
    code_challenge_method: 'S256',
    // Mostra solo gli account dell'Accademia nella scelta dell'account (il controllo vero è dopo)
    hd: ALLOWED_DOMAIN,
    prompt: 'select_account',
  }).toString()
  return url.toString()
}

/** Indirizzo a cui tornare dopo l'accesso: solo percorsi interni, mai altri siti. */
export function destinazioneSicura(dopo: unknown): string {
  if (typeof dopo !== 'string' || !dopo.startsWith('/') || dopo.startsWith('//')) return '/admin'
  if (dopo.includes('\\') || /[\r\n]/.test(dopo)) return '/admin'
  return dopo
}

export type ProfiloGoogle = { email: string; nome?: string; cognome?: string }

export class AccessoNegato extends Error {
  constructor(public motivo: 'dominio' | 'email' | 'token') {
    super(motivo)
  }
}

/** Controlla l'id_token firmato da Google e che l'account sia dell'Accademia. */
export async function verificaIdToken(idToken: string): Promise<ProfiloGoogle> {
  let claims: Record<string, unknown>
  try {
    ;({ payload: claims } = await jwtVerify(idToken, CHIAVI, {
      issuer: EMITTENTI,
      audience: process.env.GOOGLE_CLIENT_ID,
    }))
  } catch {
    throw new AccessoNegato('token')
  }
  return profiloDaClaims(claims)
}

/** Separato dalla firma per poterlo provare nei test. */
export function profiloDaClaims(claims: Record<string, unknown>): ProfiloGoogle {
  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : ''
  if (claims.hd !== ALLOWED_DOMAIN || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new AccessoNegato('dominio')
  }
  if (claims.email_verified !== true || !classifyEmail(email)) throw new AccessoNegato('email')
  return {
    email,
    nome: typeof claims.given_name === 'string' ? claims.given_name : undefined,
    cognome: typeof claims.family_name === 'string' ? claims.family_name : undefined,
  }
}

/** Scambia il codice di Google con i token e restituisce il profilo verificato. */
export async function scambiaCodice(o: { codice: string; verificatore: string; redirectUri: string }) {
  const r = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: o.codice,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: o.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: o.verificatore,
    }),
  })
  if (!r.ok) throw new AccessoNegato('token')
  const { id_token } = (await r.json()) as { id_token?: string }
  if (!id_token) throw new AccessoNegato('token')
  return verificaIdToken(id_token)
}
