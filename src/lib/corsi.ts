import type { Where } from 'payload'

import {
  LIVELLI,
  LIVELLO_LABELS,
  annoAccademicoCorrente,
  isAnnoAccademico,
  type Livello,
} from '@/access/corsi'
import { GIORNI, SEMESTRI } from '@/collections/Corsi'
import type { Corso, Docente, Scuola } from '@/payload-types'

import { payloadClient } from './payload'

export type FiltriCorsi = { anno: string; livello?: Livello; scuola?: string; q?: string }

const isLivello = (v: string): v is Livello => (LIVELLI as readonly string[]).includes(v)

/** Legge i filtri dall'URL scartando i valori non validi. L'anno in URL è 2026-2027. */
export function parseFiltriCorsi(
  params: Record<string, string | string[] | undefined>,
): FiltriCorsi {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const anno = first(params.anno)?.replace('-', '/')
  const livello = first(params.livello)
  const scuola = first(params.scuola)
  const q = first(params.q)?.trim().slice(0, 100)
  return {
    anno: isAnnoAccademico(anno) ? anno : annoAccademicoCorrente(),
    livello: livello && isLivello(livello) ? livello : undefined,
    scuola: scuola && /^[a-z0-9-]{1,96}$/.test(scuola) ? scuola : undefined,
    q: q && q.length >= 2 ? q : undefined,
  }
}

export function hrefCorsi(filtri: Partial<FiltriCorsi>): string {
  const q = new URLSearchParams()
  if (filtri.q) q.set('q', filtri.q)
  if (filtri.livello) q.set('livello', filtri.livello)
  if (filtri.scuola) q.set('scuola', filtri.scuola)
  if (filtri.anno && filtri.anno !== annoAccademicoCorrente())
    q.set('anno', filtri.anno.replace('/', '-'))
  const s = q.toString()
  return s ? `/corsi?${s}` : '/corsi'
}

/** Anni accademici con almeno un corso pubblicato, dal più recente. Include sempre quello in corso. */
export async function anniAccademici(): Promise<string[]> {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'corsi',
    select: { annoAccademico: true },
    pagination: false,
    overrideAccess: false,
    depth: 0,
  })
  const anni = new Set([annoAccademicoCorrente(), ...res.docs.map((c) => c.annoAccademico)])
  return [...anni].sort().reverse()
}

export async function trovaCorsi(filtri: FiltriCorsi, scuole: Scuola[]) {
  const payload = await payloadClient()
  const and: Where[] = [{ annoAccademico: { equals: filtri.anno } }]
  if (filtri.livello) and.push({ livelli: { contains: filtri.livello } })
  if (filtri.scuola) {
    const scuola = scuole.find((s) => s.slug === filtri.scuola)
    and.push({ scuole: { in: [scuola?.id ?? -1] } })
  }
  if (filtri.q) {
    and.push({
      or: [{ titolo: { like: filtri.q } }, { 'docenti.nomeCompleto': { like: filtri.q } }],
    })
  }
  const res = await payload.find({
    collection: 'corsi',
    where: { and },
    sort: 'titolo',
    pagination: false,
    overrideAccess: false,
    depth: 1,
    select: { titolo: true, slug: true, livelli: true, crediti: true, docenti: true },
    populate: { docenti: { nomeCompleto: true, slug: true } },
  })
  return res.docs
}

export async function trovaCorso(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'corsi',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export async function trovaDocenti() {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'docenti',
    where: { attivo: { equals: true } },
    sort: 'cognome',
    pagination: false,
    overrideAccess: false,
    depth: 1,
    select: { nome: true, cognome: true, nomeCompleto: true, slug: true, scuole: true },
    populate: { scuole: { nome: true } },
  })
  return res.docs
}

export async function trovaDocente(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'docenti',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 1,
  })
  return res.docs[0] ?? null
}

/** Corsi pubblicati di un docente, dal più recente. */
export async function corsiDelDocente(id: number) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'corsi',
    where: { docenti: { contains: id } },
    sort: ['-annoAccademico', 'titolo'],
    pagination: false,
    overrideAccess: false,
    depth: 0,
    select: { titolo: true, slug: true, livelli: true, annoAccademico: true },
  })
  return res.docs
}

export const etichettaLivelli = (livelli: Corso['livelli']) =>
  (livelli ?? []).map((l) => LIVELLO_LABELS[l]).join(' e ')

export const docentiDi = (corso: Pick<Corso, 'docenti'>) =>
  (corso.docenti ?? []).filter((d): d is Docente => typeof d === 'object')

const GIORNO = Object.fromEntries(GIORNI.map((g) => [g.value, g.label]))
const SEMESTRE = Object.fromEntries(SEMESTRI.map((s) => [s.value, s.label]))

/** Orari raggruppati per periodo, nell'ordine primo, secondo, annuale. */
export function orariPerPeriodo(orari: Corso['orari']) {
  return SEMESTRI.map((s) => ({
    periodo: SEMESTRE[s.value],
    righe: (orari ?? [])
      .filter((o) => o.semestre === s.value)
      .map((o) => ({
        id: o.id ?? `${o.giorno}-${o.dalle}`,
        giorno: GIORNO[o.giorno] ?? o.giorno,
        dalle: o.dalle,
        alle: o.alle,
        aula: o.aula,
      })),
  })).filter((g) => g.righe.length > 0)
}
