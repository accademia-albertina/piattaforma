/**
 * Apre una sessione Payload per un utente già riconosciuto (da Google), senza password.
 * Fa ciò che fa il login di Payload dopo aver controllato la password: aggiunge una sessione
 * all'utente, firma il token con gli stessi campi e prepara il cookie.
 */
import { randomUUID } from 'node:crypto'

import { getFieldsToSign, jwtSign, type Payload, type PayloadRequest } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

import type { User } from '@/payload-types'

export async function apriSessione(payload: Payload, utente: User, req?: PayloadRequest) {
  const collectionConfig = payload.collections.users.config
  const { auth } = collectionConfig
  const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
    collectionConfig,
    email: utente.email,
    user: { ...utente, collection: 'users' } as never,
  }

  if (auth.useSessions) {
    const ora = new Date()
    const sessione = {
      id: randomUUID(),
      createdAt: ora.toISOString(),
      expiresAt: new Date(ora.getTime() + auth.tokenExpiration * 1000).toISOString(),
    }
    const attive = (utente.sessions ?? []).filter((s) => new Date(s.expiresAt) > ora)
    await payload.db.updateOne({
      collection: 'users',
      id: utente.id,
      data: { sessions: [...attive, sessione] },
      req,
      returning: false,
    })
    fieldsToSignArgs.sid = sessione.id
  }

  const { token } = await jwtSign({
    fieldsToSign: getFieldsToSign(fieldsToSignArgs),
    secret: payload.secret,
    tokenExpiration: auth.tokenExpiration,
  })
  return generatePayloadCookie({
    collectionAuthConfig: auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  }) as string
}
