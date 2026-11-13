/**
 * Contenuti delle pagine delle scuole dal sito attuale (schede Triennio/Biennio, piani di
 * studio, coordinatori, video). Generati da scripts/wp/converti-scuole.ts.
 * Si scrive solo nelle scuole ancora senza contenuti: quanto modificato nel pannello resta.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

import type { Payload } from 'payload'

import { aggiornaTerminologia, aggiornaTerminologiaLexical } from '@/lib/terminologia'
import type { Scuola } from '@/payload-types'

type Percorso = {
  attivo: boolean
  sezioni?: { titolo: string; testo: unknown }[]
  piani?: { nome: string; url: string }[]
}
type Contenuti = {
  slug: string
  video: string | null
  triennio: Percorso
  biennio: Percorso
  coordinatoreDipartimento: string | null
  coordinatoreScuola: string | null
}

const dirname = path.dirname(fileURLToPath(import.meta.url))

const leggi = (): Contenuti[] =>
  JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'scuole-contenuti.json.gz'))).toString('utf8'),
  )

// I testi del sito attuale parlano di «diploma accademico»: qui diventano Laurea / Laurea magistrale.
const percorso = (p: Percorso, livello: 'triennio' | 'biennio') =>
  ({
    attivo: p.attivo,
    sezioni: (p.sezioni ?? []).map((s) => ({
      titolo: aggiornaTerminologia(s.titolo, livello),
      testo: aggiornaTerminologiaLexical(s.testo, livello),
    })),
    piani: (p.piani ?? []).map((d) => ({ nome: d.nome, url: d.url })),
  }) as Scuola['triennio']

export async function importaContenutiScuole(payload: Payload) {
  const docenti = new Map<string, number>()
  const { docs: elenco } = await payload.find({
    collection: 'docenti',
    pagination: false,
    depth: 0,
    select: { email: true },
    overrideAccess: true,
  })
  for (const d of elenco) if (d.email) docenti.set(d.email.toLowerCase(), d.id)
  const docente = (email: string | null) => (email ? (docenti.get(email) ?? null) : null)

  let scritte = 0
  for (const c of leggi()) {
    const { docs } = await payload.find({
      collection: 'scuole',
      where: { slug: { equals: c.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const scuola = docs[0]
    if (!scuola || scuola.triennio?.sezioni?.length) continue
    await payload.update({
      collection: 'scuole',
      id: scuola.id,
      data: {
        triennio: percorso(c.triennio, 'triennio'),
        biennio: percorso(c.biennio, 'biennio'),
        video: scuola.video || c.video,
        coordinatoreDipartimento:
          scuola.coordinatoreDipartimento ?? docente(c.coordinatoreDipartimento),
        coordinatoreScuola: scuola.coordinatoreScuola ?? docente(c.coordinatoreScuola),
      },
      overrideAccess: true,
    })
    scritte++
  }
  if (scritte) payload.logger.info(`Contenuti delle scuole importati: ${scritte}.`)
}
