/**
 * Lettura dei contenuti dal sito WordPress attuale tramite l'API REST pubblica: avvisi,
 * sottosezioni dell'Amministrazione trasparente (con i campi ACF, esposti dal 14/11/2026),
 * pagine dell'Albo (HTML già generato da Breakdance) e pagine.
 */
import { chiediAWp, SITO_WP } from '../wordpress'

export type Riassunto = { id: number; modificato: string; slug: string }

export type AvvisoRest = {
  id: number
  date_gmt: string
  modified_gmt: string
  slug: string
  title: { raw?: string; rendered: string }
  content: { rendered: string }
  categories: number[]
  tags: number[]
  featured_media: number
  acf?: Record<string, unknown>
}

export type TrasparenzaRest = {
  id: number
  modified: string
  modified_gmt: string
  slug: string
  title: { rendered: string }
  'amministrazione-trasparente': number[]
  acf?: {
    documenti_da_allegare?:
      | {
          testo?: string
          nome_documento?: string
          documento?: number | string | false | null
          ti_occorre_inserire_un_link?: string
          nome_del_link?: string
          link?: string
        }[]
      | false
      | null
  }
}

export type PaginaAlboRest = {
  id: number
  modified_gmt: string
  content: { rendered: string }
}

export type PaginaRest = {
  id: number
  modified_gmt: string
  link: string
  title: { rendered: string }
}

type Opzioni = { fetch?: typeof fetch }

async function json<T>(percorso: string, o: Opzioni): Promise<{ dati: T; pagine: number }> {
  const r = await chiediAWp(
    `${SITO_WP}/wp-json/wp/v2/${percorso}`,
    { headers: { accept: 'application/json' }, timeout: 60_000 },
    o.fetch,
  )
  if (!r.ok) throw new Error(`WordPress ${r.status} su ${percorso.split('?')[0]}`)
  return { dati: (await r.json()) as T, pagine: Number(r.headers.get('x-wp-totalpages')) || 1 }
}

/** Tutte le pagine di un elenco REST, 100 voci alla volta. */
async function tutti<T>(base: string, campi: string, o: Opzioni): Promise<T[]> {
  const out: T[] = []
  for (let pagina = 1, pagine = 1; pagina <= pagine; pagina++) {
    const r = await json<T[]>(
      `${base}?per_page=100&page=${pagina}&orderby=id&order=asc&_fields=${campi}`,
      o,
    )
    pagine = r.pagine
    out.push(...r.dati)
  }
  return out
}

/** ID e data di modifica di tutti gli elementi pubblicati (leggero: poche decine di KB). */
export async function elencoLeggero(tipo: 'avviso' | 'amm-trasparente', o: Opzioni = {}) {
  const righe = await tutti<{ id: number; modified_gmt: string; slug: string }>(
    tipo,
    'id,modified_gmt,slug',
    o,
  )
  return righe.map((r): Riassunto => ({ id: r.id, modificato: r.modified_gmt, slug: r.slug }))
}

/** Elementi completi per ID, a blocchi di 50. */
export async function perId<T>(tipo: 'avviso' | 'amm-trasparente', id: number[], o: Opzioni = {}) {
  const campi =
    tipo === 'avviso'
      ? 'id,date_gmt,modified_gmt,slug,title,content,categories,tags,featured_media,acf'
      : 'id,modified,modified_gmt,slug,title,amministrazione-trasparente,acf'
  const out: T[] = []
  for (let i = 0; i < id.length; i += 50) {
    const blocco = id.slice(i, i + 50)
    const { dati } = await json<T[]>(
      `${tipo}?per_page=50&include=${blocco.join(',')}&_fields=${campi}`,
      o,
    )
    out.push(...dati)
  }
  return out
}

/** Termini di una tassonomia: id → nome. */
export async function termini(tassonomia: string, o: Opzioni = {}) {
  const righe = await tutti<{ id: number; name: string }>(tassonomia, 'id,name', o)
  return new Map(righe.map((t) => [t.id, decodifica(t.name)]))
}

export const pagineAlbo = (o: Opzioni = {}) =>
  tutti<PaginaAlboRest>('albo', 'id,modified_gmt,content', o)

export const pagine = (o: Opzioni = {}) =>
  tutti<PaginaRest>('pages', 'id,modified_gmt,link,title', o)

/** Entità HTML più comuni nei titoli restituiti da WordPress. */
export function decodifica(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}
