/**
 * Tutti gli avvisi pubblicati sul sito attuale (export WordPress del 21/10/2026), per l'anteprima.
 * Il file avvisi-wp.json.gz si genera con scripts/wp/converti-avvisi.ts. Gli allegati restano link
 * ai file sul sito attuale, in fondo al testo. Ogni avviso mantiene lo slug di WordPress, così gli
 * indirizzi restano uguali. Importa solo gli avvisi che mancano (stesso slug o stesso titolo):
 * si può rilanciare a ogni avvio senza creare doppioni.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { Payload } from 'payload'

import type { Avviso } from '@/payload-types'

import { slugify } from '@/utilities/slugify'

import { SCUOLE } from './scuole-wp'

const MAX_TITOLO = 160

const dirname = path.dirname(fileURLToPath(import.meta.url))

type AvvisoWp = {
  wpId: number
  titolo: string
  slug: string
  data: string
  sommario: string | null
  categorie: Avviso['categorie']
  scuole: string[]
  contenuto: Avviso['contenuto']
}

export async function importaAvvisiWp(payload: Payload) {
  const avvisi: AvvisoWp[] = JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'avvisi-wp.json.gz'))).toString('utf8'),
  )

  const esistenti = await payload.find({
    collection: 'avvisi',
    pagination: false,
    depth: 0,
    draft: true,
    select: { slug: true, titolo: true },
  })
  const slug = new Set(esistenti.docs.map((d) => d.slug))
  const titoli = new Set(esistenti.docs.map((d) => d.titolo.trim().toLowerCase()))
  // Titoli e slug troppo lunghi vengono accorciati al salvataggio: si confrontano già accorciati,
  // altrimenti a ogni avvio si creerebbero doppioni.
  const mancanti = avvisi.filter(
    (a) =>
      !slug.has(slugify(a.slug)) && !titoli.has(a.titolo.slice(0, MAX_TITOLO).trim().toLowerCase()),
  )
  if (mancanti.length === 0) return

  const scuole = await payload.find({ collection: 'scuole', pagination: false, depth: 0 })
  const idScuola = new Map(scuole.docs.map((s) => [s.nome, s.id]))

  payload.logger.info(`Importo ${mancanti.length} avvisi dal sito attuale…`)
  let fatti = 0
  for (const a of mancanti) {
    try {
      await payload.create({
        collection: 'avvisi',
        draft: false,
        context: { importazione: true },
        data: {
          titolo: a.titolo.slice(0, MAX_TITOLO),
          slug: a.slug,
          sommario: a.sommario ?? undefined,
          categorie: a.categorie,
          scuole: a.scuole
            .map((k) => idScuola.get(SCUOLE[k]))
            .filter((id): id is number => typeof id === 'number'),
          pubblicatoIl: a.data,
          contenuto: a.contenuto,
          _status: 'published',
        },
      })
      fatti++
    } catch (e) {
      payload.logger.warn(`Avviso WP ${a.wpId} non importato: ${(e as Error).message}`)
    }
  }
  payload.logger.info(`Importati ${fatti} avvisi su ${mancanti.length}.`)
}
