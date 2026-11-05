import { headers } from 'next/headers'

import { canAccessBackend } from '@/access/roles'

import { payloadClient } from './payload'

const SLUG_VALIDO = /^[a-z0-9-]{1,120}$/

/** Calendari pubblicati, dal più recente. */
export async function elencoCalendari() {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'calendari',
    limit: 100,
    depth: 0,
    sort: ['-annoAccademico', 'titolo'],
    select: {
      titolo: true,
      sottotitolo: true,
      slug: true,
      tipo: true,
      annoAccademico: true,
      updatedAt: true,
    },
    overrideAccess: false,
  })
  return res.docs
}

/** Un calendario dallo slug; chi lavora nel pannello vede anche la bozza (per l'anteprima). */
export async function trovaCalendario(slug: string) {
  if (!SLUG_VALIDO.test(slug)) return null
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const bozza = canAccessBackend(user)
  const res = await payload.find({
    collection: 'calendari',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    draft: bozza,
    user,
    overrideAccess: false,
  })
  const doc = res.docs[0]
  return doc ? { calendario: doc, bozza: bozza && doc._status !== 'published' } : null
}
