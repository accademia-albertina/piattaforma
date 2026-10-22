import { headers } from 'next/headers'

import { canAccessBackend } from '@/access/roles'
import type { Pagina } from '@/payload-types'

import { payloadClient } from './payload'

const PERCORSO_VALIDO = /^[a-z0-9-]{1,96}(?:\/[a-z0-9-]{1,96}){0,5}$/

/**
 * Trova una pagina dal percorso. Chi è entrato nel pannello vede anche l'ultima bozza
 * (così il pulsante Anteprima mostra le modifiche non ancora pubblicate).
 */
export async function trovaPagina(
  segmenti: string[],
): Promise<{ pagina: Pagina; bozza: boolean } | null> {
  const percorso = segmenti.join('/').toLowerCase()
  if (!PERCORSO_VALIDO.test(percorso)) return null
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const bozza = canAccessBackend(user)
  const res = await payload.find({
    collection: 'pagine',
    where: { percorso: { equals: percorso } },
    limit: 1,
    depth: 1,
    draft: bozza,
    user,
    overrideAccess: false,
  })
  const pagina = res.docs[0]
  return pagina ? { pagina, bozza: bozza && pagina._status !== 'published' } : null
}

/** Pagine antenate, dalla radice al genitore diretto, per le briciole di pane. */
export async function antenati(pagina: Pagina): Promise<Pick<Pagina, 'titolo' | 'percorso'>[]> {
  const parti = (pagina.percorso ?? '').split('/')
  const prefissi = parti.slice(0, -1).map((_, i) => parti.slice(0, i + 1).join('/'))
  if (prefissi.length === 0) return []
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'pagine',
    where: { percorso: { in: prefissi } },
    limit: prefissi.length,
    depth: 0,
    select: { titolo: true, percorso: true },
    overrideAccess: false,
  })
  return prefissi.flatMap((p) => res.docs.filter((d) => d.percorso === p))
}

/** Sottopagine pubblicate, per l'indice in fondo alle pagine "contenitore". */
export async function sottopagine(pagina: Pagina) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'pagine',
    where: { genitore: { equals: pagina.id } },
    limit: 100,
    depth: 0,
    sort: 'titolo',
    select: { titolo: true, percorso: true, sommario: true },
    overrideAccess: false,
  })
  return res.docs
}
