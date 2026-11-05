import type { Where } from 'payload'

import { CATEGORIA_LABELS, isCategoria, type CategoriaAvviso } from '@/access/avvisi'
import type { Avviso, Scuola } from '@/payload-types'
import { senzaLink } from '@/utilities/autolink'
import { lexicalToText, tronca } from '@/utilities/lexicalText'

import { payloadClient } from './payload'

export const AVVISI_PER_PAGINA = 12

export type FiltriAvvisi = { categoria?: CategoriaAvviso; scuola?: string; pagina: number }

/** Legge i filtri dall'URL scartando i valori non validi. */
export function parseFiltri(params: Record<string, string | string[] | undefined>): FiltriAvvisi {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const categoria = first(params.categoria)
  const scuola = first(params.scuola)
  const pagina = Number.parseInt(first(params.pagina) ?? '1', 10)
  return {
    categoria: categoria && isCategoria(categoria) ? categoria : undefined,
    scuola: scuola && /^[a-z0-9-]{1,96}$/.test(scuola) ? scuola : undefined,
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.min(pagina, 1000) : 1,
  }
}

export function hrefAvvisi(filtri: Partial<FiltriAvvisi>): string {
  const q = new URLSearchParams()
  if (filtri.categoria) q.set('categoria', filtri.categoria)
  if (filtri.scuola) q.set('scuola', filtri.scuola)
  if (filtri.pagina && filtri.pagina > 1) q.set('pagina', String(filtri.pagina))
  const s = q.toString()
  return s ? `/avvisi?${s}` : '/avvisi'
}

export async function trovaScuole(): Promise<Scuola[]> {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'scuole',
    limit: 50,
    sort: 'nome',
    overrideAccess: false,
    depth: 1,
  })
  return res.docs
}

export async function trovaAvvisi(filtri: FiltriAvvisi, scuole: Scuola[]) {
  const payload = await payloadClient()
  const where: Where = { and: [] as Where[] }
  if (filtri.categoria) (where.and as Where[]).push({ categorie: { contains: filtri.categoria } })
  if (filtri.scuola) {
    const scuola = scuole.find((s) => s.slug === filtri.scuola)
    // Scuola sconosciuta: nessun risultato invece di ignorare il filtro.
    ;(where.and as Where[]).push({ scuole: { in: [scuola?.id ?? -1] } })
  }
  return payload.find({
    collection: 'avvisi',
    where,
    sort: '-pubblicatoIl',
    limit: AVVISI_PER_PAGINA,
    page: filtri.pagina,
    overrideAccess: false,
    depth: 0,
  })
}

export async function trovaAvviso(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'avvisi',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export function sommarioAvviso(avviso: Pick<Avviso, 'sommario' | 'contenuto'>): string {
  // Gli indirizzi (moduli, Classroom) restano nel testo dell'avviso: nell'anteprima sono solo rumore.
  const testo = avviso.sommario?.trim() || lexicalToText(avviso.contenuto, 2000)
  return tronca(senzaLink(testo), 200)
}

export function categorieAvviso(avviso: Pick<Avviso, 'categorie'>) {
  return (avviso.categorie ?? []).map((c) => ({
    label: CATEGORIA_LABELS[c],
    href: hrefAvvisi({ categoria: c }),
    evidenza: c === 'in-evidenza',
  }))
}

/** Ultimi avvisi pubblicati, per la homepage. */
export async function ultimiAvvisi(limit = 3) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'avvisi',
    sort: '-pubblicatoIl',
    limit,
    overrideAccess: false,
    depth: 0,
    pagination: false,
  })
  return res.docs
}

/** Avvisi della categoria In evidenza per lo slider della homepage, con l'immagine. */
export async function avvisiInEvidenza(limit = 5) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'avvisi',
    where: { categorie: { contains: 'in-evidenza' } },
    sort: '-pubblicatoIl',
    limit,
    overrideAccess: false,
    depth: 1,
    pagination: false,
  })
  return res.docs
}

/** Ricerca semplice negli avvisi per titolo e sommario. */
export async function cercaAvvisi(q: string, pagina = 1) {
  const payload = await payloadClient()
  return payload.find({
    collection: 'avvisi',
    where: { or: [{ titolo: { like: q } }, { sommario: { like: q } }] },
    sort: '-pubblicatoIl',
    limit: AVVISI_PER_PAGINA,
    page: pagina,
    overrideAccess: false,
    depth: 0,
  })
}
