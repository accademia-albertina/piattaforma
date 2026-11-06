import { cache } from 'react'

import { DIPARTIMENTI } from '@/collections/Scuole'
import type { Docente, Scuola } from '@/payload-types'

import { payloadClient } from './payload'

/** Una scuola con i coordinatori (profili docenti) già caricati. */
export const trovaScuola = cache(async (slug: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'scuole',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

/** Docenti in servizio che afferiscono alla scuola (campo Scuole del profilo). */
export async function docentiDellaScuola(id: number) {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'docenti',
    where: { and: [{ scuole: { contains: id } }, { attivo: { equals: true } }] },
    sort: 'cognome',
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { nomeCompleto: true, slug: true },
  })
  return docs
}

/** Ultimi avvisi della scuola. */
export async function avvisiDellaScuola(id: number, limit = 3) {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'avvisi',
    where: { scuole: { in: [id] } },
    sort: '-pubblicatoIl',
    limit,
    pagination: false,
    depth: 0,
    overrideAccess: false,
  })
  return docs
}

export const docenteDi = (v: Scuola['coordinatoreScuola']) =>
  v && typeof v === 'object' ? (v as Docente) : null

/** Le scuole raggruppate per dipartimento, nell'ordine del sito attuale. */
export function perDipartimento(scuole: Scuola[]) {
  return DIPARTIMENTI.map((d) => ({
    ...d,
    scuole: scuole.filter((s) => s.dipartimento === d.value),
  })).filter((d) => d.scuole.length > 0)
}

/** Durata e crediti dei due livelli (60 CFA per anno accademico). */
export const LIVELLI = {
  triennio: { titolo: 'Triennio', livello: 'Diploma accademico di primo livello', anni: 3, cfa: 180 },
  biennio: {
    titolo: 'Biennio specialistico',
    livello: 'Diploma accademico di secondo livello',
    anni: 2,
    cfa: 120,
  },
} as const
