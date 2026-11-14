/**
 * Albo online del sito attuale: 4 pagine Breakdance a fisarmonica (tipo di contenuto `albo`).
 * Si leggono dall'HTML già generato che l'API REST pubblica restituisce in `content.rendered`.
 *
 * Stesse regole di scripts/wp/estrai-albo.py (che leggeva l'albero Breakdance dal database),
 * così gli atti già importati si riconoscono: ogni pannello della fisarmonica è una categoria;
 * dentro, i testi aprono un atto e gli elenchi di link sono i suoi documenti. I testi
 * «A.A. 2025/2026» o «Anno 2025» non sono atti: danno l'anno agli atti che seguono.
 */
import type { SezioneAlbo } from '@/lib/albo'

export type AttoWp = {
  sezione: SezioneAlbo
  categoria: string
  anno: string | null
  titolo: string
  pubblicatoIl: string | null
  scadenza: string | null
  documenti: { nome: string; url: string }[]
}

/** ID delle pagine WordPress dell'Albo e sezione corrispondente. */
export const PAGINE_ALBO: Record<number, SezioneAlbo> = {
  3404: 'bandi-di-concorso',
  3433: 'bandi-generici',
  3446: 'bandi-di-gara',
  5015: 'sindacale',
}

const ANNO = /^(?:A\.?\s?A\.?|anno accademico|anno)\s*(\d{4}(?:\s*[/-]\s*\d{2,4})?)$/i

const ENTITA: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** Come `testo()` dello script Python: <br> → spazio, niente tag, spazi compressi. */
export function testoDaHtml(html: string): string {
  const s = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, c: string) => {
      if (c[0] === '#')
        return String.fromCodePoint(
          c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : Number(c.slice(1)),
        )
      return ENTITA[c.toLowerCase()] ?? e
    })
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s\-–]+|[\s\-–]+$/g, '')
}

type Documento = { querySelectorAll: (s: string) => ArrayLike<Elemento> }
type Elemento = {
  classList: { contains: (c: string) => boolean }
  innerHTML: string
  querySelectorAll: (s: string) => ArrayLike<Elemento>
  querySelector: (s: string) => Elemento | null
  getAttribute: (n: string) => string | null
}

/** Atti di una pagina dell'Albo (documento DOM già costruito da `html`). */
export function attiDaPagina(doc: Documento, sezione: SezioneAlbo): AttoWp[] {
  const atti: AttoWp[] = []
  let categoria: string | null = null
  let anno: string | null = null
  let atto: AttoWp | null = null
  const chiudi = () => {
    if (atto && atto.documenti.length) atti.push(atto)
    atto = null
  }
  const nodi = Array.from(
    doc.querySelectorAll(
      '.bde-accordion__title, .bde-rich-text, .bde-text, .bde-heading, .bde-icon-list',
    ),
  )
  for (const n of nodi) {
    if (n.classList.contains('bde-accordion__title')) {
      chiudi()
      categoria = testoDaHtml(n.innerHTML)
      anno = null
    } else if (n.classList.contains('bde-icon-list')) {
      if (!categoria) continue
      for (const a of Array.from(n.querySelectorAll('li a'))) {
        const url = (a.getAttribute('href') ?? '').trim()
        const t = a.querySelector('.bde-icon-list__text')
        const nome = testoDaHtml(t ? t.innerHTML : a.innerHTML)
        // Breakdance scrive "#" quando il link è vuoto (nel database era vuoto e si saltava)
        if (!url || url === '#') continue
        if (atto === null) {
          // documenti senza titolo sopra: ognuno è un atto a sé
          atti.push({
            sezione,
            categoria,
            anno,
            titolo: nome || url.split('/').pop()!,
            pubblicatoIl: null,
            scadenza: null,
            documenti: [{ nome: nome || 'Documento', url }],
          })
        } else {
          ;(atto as AttoWp).documenti.push({ nome: nome || url.split('/').pop()!, url })
        }
      }
    } else if (categoria) {
      const t = testoDaHtml(n.innerHTML)
      if (t && t.length > 2) {
        const m = ANNO.exec(t)
        chiudi()
        if (m) anno = m[1].replace(/ /g, '')
        else
          atto = {
            sezione,
            categoria,
            anno,
            titolo: t,
            pubblicatoIl: null,
            scadenza: null,
            documenti: [],
          }
      }
    }
  }
  chiudi()
  for (const a of atti) completaDate(a)
  return atti
}

/** Data di pubblicazione (primo mese di caricamento dei documenti) e scadenza nel testo. */
function completaDate(a: AttoWp) {
  const mesi = [
    ...a.documenti
      .map((d) => d.url)
      .join(' ')
      .matchAll(/\/uploads\/(\d{4})\/(\d{2})\//g),
  ]
    .map((m) => `${m[1]}-${m[2]}`)
    .sort()
  a.pubblicatoIl = mesi.length ? `${mesi[0]}-01` : null
  const m = /scad\.?\w*\s*(?:il\s*)?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/i.exec(
    [a.titolo, ...a.documenti.map((d) => d.nome)].join(' '),
  )
  a.scadenza = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}
