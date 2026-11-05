/**
 * Catalogo Albertina Press del sito attuale (99 pubblicazioni), per l'anteprima.
 * albertina-press.json.gz si genera con scripts/wp/estrai-albertina-press.py; le copertine,
 * ridotte a 600 px in WebP, stanno in copertine-press/<wpId>.webp.
 * Si creano solo le pubblicazioni il cui indirizzo non esiste ancora: quelle già presenti
 * (anche modificate nel pannello) non si toccano, e un'importazione interrotta riprende.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { Payload } from 'payload'

import type { Collana } from '@/collections/Pubblicazioni'
import { tronca } from '@/utilities/lexicalText'
import { inFrase } from '@/utilities/maiuscole'
import { slugify } from '@/utilities/slugify'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type PubblicazioneWp = {
  wpId: number
  titolo: string
  slug: string
  numero: number | null
  collana: string | null
  autori: string | null
  luogoAnno: string | null
  anno: number | null
  pagine: number | null
  dimensioni: string | null
  lingua: string | null
  isbn: string | null
  prezzo: number | null
  descrizione: string | null
  indice: { pagina: string | null; titolo: string; autori: string | null }[]
}

export const COLLANE_WP: Record<string, Collana> = {
  Arcate: 'arcate',
  Galleria: 'galleria',
  Hbitat: 'hbitat',
  'Quaderni dell’Accademia': 'quaderni',
  'R-ESISTENZE': 'r-esistenze',
  Visioni: 'visioni',
}

export async function importaAlbertinaPress(payload: Payload) {
  const voci: PubblicazioneWp[] = JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'albertina-press.json.gz'))).toString('utf8'),
  )
  const { docs } = await payload.find({
    collection: 'pubblicazioni',
    pagination: false,
    depth: 0,
    select: { slug: true },
    overrideAccess: true,
  })
  const esistenti = new Set(docs.map((d) => d.slug))
  // Gli indirizzi più lunghi di 96 caratteri si accorciano: si confrontano già accorciati
  const mancanti = voci.filter((v) => !esistenti.has(slugify(v.slug)))
  if (mancanti.length === 0) return
  payload.logger.info(`Importo ${mancanti.length} pubblicazioni di Albertina Press…`)
  // Dalla più vecchia: così l'ordine di creazione segue il catalogo
  for (const v of [...mancanti].reverse()) {
    const titolo = inFrase(v.titolo)
    const file = path.join(dirname, 'copertine-press', `${v.wpId}.webp`)
    const copertina = existsSync(file)
      ? await payload.create({
          collection: 'media',
          context: { importazione: true },
          data: { alt: tronca(`Copertina di “${titolo}”`, 199) },
          filePath: file,
          overrideAccess: true,
        })
      : null
    await payload.create({
      collection: 'pubblicazioni',
      context: { importazione: true },
      data: {
        titolo,
        slug: v.slug,
        numero: v.numero,
        collana: v.collana ? COLLANE_WP[v.collana] : undefined,
        autori: v.autori,
        luogoAnno: v.luogoAnno,
        anno: v.anno,
        pagine: v.pagine,
        dimensioni: v.dimensioni,
        lingua: v.lingua,
        isbn: v.isbn,
        prezzo: v.prezzo,
        descrizione: v.descrizione,
        indice: v.indice.map((i) => ({
          pagina: i.pagina ?? undefined,
          titolo: i.titolo,
          autori: i.autori ?? undefined,
        })),
        copertina: copertina?.id,
      },
      overrideAccess: true,
    })
  }
  payload.logger.info('Albertina Press importata.')
}
