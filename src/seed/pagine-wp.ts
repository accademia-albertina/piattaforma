/**
 * Pagine istituzionali del sito attuale (Accademia, Didattica, Studente, Dottorati, Erasmus,
 * Contatti, privacy…), per l'anteprima. Il file pagine-wp.json.gz si genera con
 * scripts/wp/estrai-pagine.py e scripts/wp/converti-pagine.ts. I file restano link al sito
 * attuale. Si creano solo le pagine il cui indirizzo non esiste ancora: quelle già presenti
 * (anche modificate nel pannello) non si toccano, e un'importazione interrotta riprende.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { Payload } from 'payload'

import type { Pagina } from '@/payload-types'
import { inFrase } from '@/utilities/maiuscole'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type PaginaWp = {
  wpId: number
  titolo: string
  slug: string
  percorso: string
  genitore: string | null
  sommario: string | null
  blocchi: NonNullable<Pagina['blocchi']>
}

export async function importaPagineWp(payload: Payload) {
  const pagine: PaginaWp[] = JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'pagine-wp.json.gz'))).toString('utf8'),
  )
  const esistenti = await payload.find({
    collection: 'pagine',
    pagination: false,
    depth: 0,
    draft: true,
    select: { percorso: true },
    overrideAccess: true,
  })
  const id = new Map(esistenti.docs.map((d) => [d.percorso, d.id]))
  const mancanti = pagine.filter((p) => !id.has(p.percorso))
  if (mancanti.length === 0) return
  payload.logger.info(`Importo ${mancanti.length} pagine dal sito attuale…`)
  // Il file è ordinato con i genitori prima delle sottopagine.
  for (const p of mancanti) {
    const genitore = p.genitore ? id.get(p.genitore) : undefined
    if (p.genitore && !genitore) {
      payload.logger.warn(`Pagina ${p.percorso}: manca la pagina genitore, la salto.`)
      continue
    }
    const creata = await payload.create({
      collection: 'pagine',
      data: {
        titolo: inFrase(p.titolo),
        slug: p.slug,
        sommario: p.sommario,
        genitore,
        blocchi: p.blocchi,
        _status: 'published',
      },
      overrideAccess: true,
    })
    id.set(creata.percorso, creata.id)
  }
  payload.logger.info('Pagine istituzionali importate.')
}
