/**
 * Lettura dei file (media) dal sito WordPress attuale tramite l'API REST pubblica
 * (/wp-json/wp/v2/media) e riconoscimento dei link a wp-content/uploads nei contenuti.
 */

export const SITO_WP = (process.env.WP_URL || 'https://albertina-academy.it').replace(/\/+$/, '')

/** Chi siamo, per i log del sito WordPress (niente dati personali). */
export const USER_AGENT = 'AlbertinaPiattaforma/1.0 (importazione file)'

export type MediaWp = {
  id: number
  modificato: string
  url: string
  mimeType: string
  alt: string
  titolo: string
}

type RigaRest = {
  id: number
  modified_gmt: string
  source_url: string
  mime_type: string
  alt_text?: string
  title?: { rendered?: string }
}

/**
 * Richiesta a WordPress con nuovi tentativi: il sito attuale risponde a volte 503 o 429
 * quando è sotto carico. Si riprova dopo 2, 4 e 8 secondi.
 */
export async function chiediAWp(
  url: string,
  init: RequestInit & { timeout: number },
  f: typeof fetch = fetch,
): Promise<Response> {
  for (let tentativo = 0; ; tentativo++) {
    let r: Response | null = null
    try {
      r = await f(url, {
        ...init,
        headers: { 'user-agent': USER_AGENT, ...init.headers },
        signal: AbortSignal.timeout(init.timeout),
      })
      if (r.ok || ![429, 500, 502, 503, 504].includes(r.status) || tentativo >= 3) return r
      await r.body?.cancel()
    } catch (e) {
      if (tentativo >= 3) throw e
    }
    await new Promise((ok) => setTimeout(ok, 2000 * 2 ** tentativo))
  }
}

const CAMPI = 'id,modified_gmt,source_url,mime_type,alt_text,title'

/** Link a un file caricato su WordPress (anche www., stage., http). Gruppo 1: percorso dopo uploads/. */
export const RE_LINK_WP =
  /https?:\/\/(?:www\.|stage\.)?albertina-academy\.it\/wp-content\/uploads\/([^\s"'<>?#)\\]+)(?:\?[^\s"'<>#)\\]*)?(?:#[^\s"'<>)\\]*)?/gi

/**
 * Chiave di confronto di un file WordPress: percorso dopo uploads/ senza le varianti create da
 * WordPress (-scaled, -1024x683), decodificato e minuscolo. Così il link a una miniatura
 * porta al file originale importato.
 */
export function chiaveWp(urlOPercorso: string): string {
  let p = urlOPercorso
  const i = p.indexOf('/wp-content/uploads/')
  if (i >= 0) p = p.slice(i + '/wp-content/uploads/'.length)
  p = p.split(/[?#]/)[0]
  try {
    p = decodeURIComponent(p)
  } catch {
    // percorso con % non valido: si usa com'è
  }
  return p
    .replace(/-scaled(?=\.[a-z0-9]+$)/i, '')
    .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')
    .toLowerCase()
}

const testo = (html = '') =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .trim()

const converti = (r: RigaRest): MediaWp => ({
  id: r.id,
  modificato: r.modified_gmt,
  url: r.source_url,
  mimeType: r.mime_type,
  alt: (r.alt_text ?? '').trim(),
  titolo: testo(r.title?.rendered),
})

/** Tutti i media pubblici di WordPress, 100 per pagina (circa 3.300 voci, pochi MB). */
export async function elencoMediaWp(o: { fetch?: typeof fetch } = {}): Promise<MediaWp[]> {
  const f = o.fetch ?? fetch
  const tutti: MediaWp[] = []
  for (let pagina = 1, pagine = 1; pagina <= pagine; pagina++) {
    const url = `${SITO_WP}/wp-json/wp/v2/media?per_page=100&page=${pagina}&orderby=id&order=asc&_fields=${CAMPI}`
    const r = await chiediAWp(url, { headers: { accept: 'application/json' }, timeout: 60_000 }, f)
    if (!r.ok) throw new Error(`WordPress ${r.status} sulla pagina ${pagina} dei file`)
    pagine = Number(r.headers.get('x-wp-totalpages')) || pagina
    const righe = (await r.json()) as RigaRest[]
    tutti.push(...righe.map(converti))
  }
  return tutti
}

/** Solo il numero dei media pubblici (una richiesta): per il confronto nel pannello. */
export async function contaMediaWp(o: { fetch?: typeof fetch } = {}): Promise<number | null> {
  try {
    const r = await (o.fetch ?? fetch)(`${SITO_WP}/wp-json/wp/v2/media?per_page=1&_fields=id`, {
      headers: { 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    })
    await r.body?.cancel()
    return r.ok ? Number(r.headers.get('x-wp-total')) : null
  } catch {
    return null
  }
}

/** Nome del file sul nuovo sito: quello di WordPress, ripulito. */
export function nomeFileDaWp(url: string): string {
  const base = decodeURIComponent(url.split(/[?#]/)[0].split('/').pop() || 'file')
  return (
    base
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+/, '') || 'file'
  )
}
