/**
 * Riscrittura dei link ai file di WordPress nei contenuti: ogni link a wp-content/uploads che
 * corrisponde a un file importato punta al file nuovo. Funzione pura, senza database.
 *
 * - Righe "documento" ({ url, file }): il link diventa il file caricato (campo `file`), così nel
 *   pannello il documento compare come file e non come link esterno.
 * - Qualsiasi altro testo (link nel testo formattato, pulsanti, piani di studio): l'indirizzo
 *   WordPress è sostituito con quello del file sul nuovo sito.
 * - Il testo visibile (chiave `text` di Lexical) non si tocca, tranne il testo di un link che è
 *   l'indirizzo WordPress nudo: diventa il nome del file invece di un indirizzo che non porta
 *   più lì.
 */
import { chiaveWp, RE_LINK_WP } from './wordpress'

export type FileImportato = {
  id: number
  url: string
  /** Nome leggibile, per i link il cui testo era l'indirizzo. */ nome?: string
}
export type MappaFile = Map<string, FileImportato>

export type Esito = {
  valore: unknown
  cambiati: number
  /** Link a WordPress senza file corrispondente (restano come sono). */
  nonTrovati: string[]
}

const RE_SOLO_LINK = new RegExp(`^\\s*${RE_LINK_WP.source}\\s*$`, 'i')

function sostituisci(s: string, mappa: MappaFile, esito: Esito): string {
  return s.replace(new RegExp(RE_LINK_WP.source, 'gi'), (link) => {
    const file = mappa.get(chiaveWp(link))
    if (!file) {
      esito.nonTrovati.push(link)
      return link
    }
    esito.cambiati++
    return file.url
  })
}

function visita(v: unknown, mappa: MappaFile, esito: Esito, chiave?: string): unknown {
  if (typeof v === 'string') {
    if (!v.includes('wp-content/uploads')) return v
    if (chiave === 'text') return v
    return sostituisci(v, mappa, esito)
  }
  if (Array.isArray(v)) return v.map((x) => visita(x, mappa, esito))
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    // Link il cui testo è l'indirizzo WordPress: il testo diventa il nome del file
    if (o.type === 'link' && Array.isArray(o.children) && o.children.length === 1) {
      const t = o.children[0] as Record<string, unknown>
      const file =
        typeof t?.text === 'string' && RE_SOLO_LINK.test(t.text)
          ? mappa.get(chiaveWp(t.text.trim()))
          : undefined
      if (file?.nome) {
        esito.cambiati++
        const link = visita({ ...o, children: [] }, mappa, esito) as Record<string, unknown>
        return { ...link, children: [{ ...t, text: file.nome }] }
      }
    }
    // Riga documento: link a un file importato → file caricato
    if ('file' in o && !o.file && typeof o.url === 'string' && RE_SOLO_LINK.test(o.url)) {
      const file = mappa.get(chiaveWp(o.url.trim()))
      if (file) {
        esito.cambiati++
        const resto = Object.fromEntries(
          Object.entries(o)
            .filter(([k]) => k !== 'file' && k !== 'url')
            .map(([k, x]) => [k, visita(x, mappa, esito, k)]),
        )
        return { ...resto, file: file.id, url: null }
      }
    }
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, visita(x, mappa, esito, k)]))
  }
  return v
}

/** Riscrive i link in un valore qualsiasi (documento, campo, array). */
export function riscriviLink(valore: unknown, mappa: MappaFile): Esito {
  const esito: Esito = { valore: undefined, cambiati: 0, nonTrovati: [] }
  esito.valore = visita(valore, mappa, esito)
  return esito
}
