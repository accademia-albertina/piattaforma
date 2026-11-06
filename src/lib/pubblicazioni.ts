import type { Where } from 'payload'

import { COLLANE, PERCORSO_PRESS, type Collana } from '@/collections/Pubblicazioni'

import { payloadClient } from './payload'

export const PUBBLICAZIONI_PER_PAGINA = 24

export type FiltriCatalogo = { collana?: Collana; q?: string; pagina: number }

const isCollana = (v: string): v is Collana => COLLANE.some((c) => c.value === v)

/** Legge i filtri dall'URL scartando i valori non validi. */
export function parseFiltriCatalogo(
  params: Record<string, string | string[] | undefined>,
): FiltriCatalogo {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const collana = first(params.collana)
  const q = first(params.q)?.trim().slice(0, 80)
  const pagina = Number.parseInt(first(params.pagina) ?? '1', 10)
  return {
    collana: collana && isCollana(collana) ? collana : undefined,
    q: q || undefined,
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.min(pagina, 100) : 1,
  }
}

export function hrefCatalogo(filtri: Partial<FiltriCatalogo>): string {
  const q = new URLSearchParams()
  if (filtri.collana) q.set('collana', filtri.collana)
  if (filtri.q) q.set('q', filtri.q)
  if (filtri.pagina && filtri.pagina > 1) q.set('pagina', String(filtri.pagina))
  const s = q.toString()
  return `${PERCORSO_PRESS}${s ? `?${s}` : ''}#catalogo`
}

/** Catalogo dal numero più alto (le uscite più recenti), con filtro per collana e ricerca. */
export async function trovaPubblicazioni(filtri: FiltriCatalogo) {
  const payload = await payloadClient()
  const and: Where[] = []
  if (filtri.collana) and.push({ collana: { equals: filtri.collana } })
  if (filtri.q)
    and.push({
      or: [
        { titolo: { like: filtri.q } },
        { autori: { like: filtri.q } },
        { isbn: { like: filtri.q } },
      ],
    })
  return payload.find({
    collection: 'pubblicazioni',
    where: and.length ? { and } : undefined,
    sort: '-numero',
    limit: PUBBLICAZIONI_PER_PAGINA,
    page: filtri.pagina,
    overrideAccess: false,
    depth: 1,
    select: { titolo: true, slug: true, collana: true, anno: true, autori: true, copertina: true },
  })
}

export async function trovaPubblicazione(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'pubblicazioni',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 1,
  })
  return res.docs[0] ?? null
}

/** Prezzo in euro alla maniera italiana: 20 → "20,00 €". */
export const prezzoEuro = (v: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v)
