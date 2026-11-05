import type { Where } from 'payload'

import { SEZIONI_ALBO, type SezioneAlbo } from './albo'
import { payloadClient } from './payload'

export const ATTI_PER_PAGINA = 20

export type FiltriAlbo = {
  categoria: string
  anno: string
  q: string
  pagina: number
  solo: '' | 'aperti'
}

const primo = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

export const sezioneValida = (s: string): s is SezioneAlbo =>
  (SEZIONI_ALBO as readonly string[]).includes(s)

export function parseFiltriAlbo(p: Record<string, string | string[] | undefined>): FiltriAlbo {
  const pagina = Number.parseInt(primo(p.pagina) || '1', 10)
  return {
    categoria: primo(p.categoria).slice(0, 120),
    anno: primo(p.anno).slice(0, 20),
    q: primo(p.q).slice(0, 80),
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.min(pagina, 500) : 1,
    solo: primo(p.solo) === 'aperti' ? 'aperti' : '',
  }
}

export function hrefAlbo(sezione: SezioneAlbo, f: Partial<FiltriAlbo>) {
  const qs = new URLSearchParams()
  if (f.q) qs.set('q', f.q)
  if (f.categoria) qs.set('categoria', f.categoria)
  if (f.anno) qs.set('anno', f.anno)
  if (f.solo) qs.set('solo', f.solo)
  if (f.pagina && f.pagina > 1) qs.set('pagina', String(f.pagina))
  const s = qs.toString()
  return `/albo/${sezione}${s ? `?${s}` : ''}`
}

const oggi = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Atti pubblicati di una sezione, filtrati e paginati, dal più recente. */
export async function trovaAtti(sezione: SezioneAlbo, f: FiltriAlbo) {
  const payload = await payloadClient()
  const and: Where[] = [{ sezione: { equals: sezione } }]
  if (f.categoria) and.push({ categoria: { equals: f.categoria } })
  if (f.anno) and.push({ annoAccademico: { equals: f.anno } })
  if (f.solo === 'aperti') and.push({ scadenza: { greater_than_equal: oggi() } })
  if (f.q) and.push({ or: [{ titolo: { like: f.q } }, { 'documenti.nome': { like: f.q } }] })
  return payload.find({
    collection: 'albo',
    where: { and },
    sort: ['-pubblicatoIl', '-id'],
    limit: ATTI_PER_PAGINA,
    page: f.pagina,
    depth: 1,
    overrideAccess: false,
  })
}

/** Categorie e anni presenti in una sezione, per i filtri. */
export async function valoriFiltriAlbo(sezione: SezioneAlbo) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'albo',
    where: { sezione: { equals: sezione } },
    pagination: false,
    depth: 0,
    select: { categoria: true, annoAccademico: true },
    overrideAccess: false,
  })
  const categorie = new Map<string, number>()
  const anni = new Set<string>()
  for (const d of res.docs) {
    categorie.set(d.categoria, (categorie.get(d.categoria) ?? 0) + 1)
    if (d.annoAccademico) anni.add(d.annoAccademico)
  }
  return {
    categorie: [...categorie.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    anni: [...anni].sort().reverse(),
  }
}

/** Numero di atti per sezione e atti con scadenza non ancora passata, per la pagina dell'Albo. */
export async function riepilogoAlbo() {
  const payload = await payloadClient()
  const conteggi = await Promise.all(
    SEZIONI_ALBO.map(async (s) => {
      const { totalDocs } = await payload.count({
        collection: 'albo',
        where: { sezione: { equals: s } },
        overrideAccess: false,
      })
      return [s, totalDocs] as const
    }),
  )
  const aperti = await payload.find({
    collection: 'albo',
    where: { scadenza: { greater_than_equal: oggi() } },
    sort: 'scadenza',
    limit: 10,
    depth: 1,
    overrideAccess: false,
  })
  const recenti = await payload.find({
    collection: 'albo',
    sort: ['-pubblicatoIl', '-id'],
    limit: 6,
    depth: 1,
    overrideAccess: false,
  })
  return {
    conteggi: Object.fromEntries(conteggi) as Record<SezioneAlbo, number>,
    aperti: aperti.docs,
    recenti: recenti.docs,
  }
}

/** Tutte le sottosezioni pubblicate della trasparenza (solo i campi per gli indici). */
export async function elencoTrasparenza() {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'trasparenza',
    pagination: false,
    depth: 0,
    sort: 'titolo',
    select: { titolo: true, slug: true, sezione: true, aggiornatoIl: true },
    overrideAccess: false,
  })
  return res.docs
}

const SLUG_VALIDO = /^[a-z0-9-]{1,200}$/

export async function trovaTrasparenza(slug: string) {
  if (!SLUG_VALIDO.test(slug)) return null
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'trasparenza',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}
