/**
 * Converte gli avvisi estratti dal database WordPress (JSON con HTML) nel formato Lexical
 * di Payload e scrive src/seed/avvisi-wp.json.gz. Uso:
 *   pnpm payload run scripts/wp/converti-avvisi.ts <avvisi.json>
 * Il JSON si ottiene da un export del DB WP (solo avvisi pubblicati, vedi estrai-avvisi.py).
 */
import config from '@payload-config'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

type Grezzo = {
  wpId: number
  titolo: string
  slug: string
  data: string
  html: string
  sommario: string | null
  categorie: string[]
  scuole: string[]
  allegati: { nome: string; url: string }[]
}

// Gli URL dei file puntano ancora al vecchio dominio di sviluppo del sito WP
const dominio = (s: string) =>
  s.replace(/https?:\/\/(www\.)?newalbertina\.eu/g, 'https://albertina-academy.it')

function pulisci(html: string) {
  return dominio(html)
    .replace(/<!--[\s\S]*?-->/g, '') // commenti dei blocchi Gutenberg
    // Le immagini nel testo richiedono i file nella libreria media: per l'anteprima si tolgono
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '') // paragrafi vuoti
    .replace(/ /g, ' ')
    .trim()
}

/** "2026-10-21 15:12:26" (ora di Roma, senza fuso) → ISO in UTC, con l'ora legale giusta. */
function daRoma(locale: string) {
  const comeUtc = new Date(`${locale.replace(' ', 'T')}Z`)
  const roma = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'Europe/Rome' }))
  const utc = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(comeUtc.getTime() - (roma.getTime() - utc.getTime())).toISOString()
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Nodo = { type?: string; children?: Nodo[]; fields?: { url?: string } }

/** Corregge i link scritti male nel sito attuale; quelli senza destinazione diventano testo. */
function correggiLink(n: Nodo): Nodo[] {
  const figli = n.children?.flatMap(correggiLink)
  if (figli) n.children = figli
  if (n.type !== 'link' || !n.fields) return [n]
  // Alcuni link hanno testo incollato dopo l'indirizzo: si tiene solo la prima parola
  let url = (n.fields.url ?? '').trim().split(/\s+/)[0] ?? ''
  if (/^h?ttps?:\/\//.test(url) || /^hhttps?:\/\//.test(url)) url = url.replace(/^h*ttp/, 'http')
  else if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(url)) url = `mailto:${url}`
  else if (url.startsWith('/')) url = `https://albertina-academy.it${url}`
  if (!/^(https?:\/\/|mailto:|tel:)/.test(url)) return n.children ?? []
  n.fields.url = url
  return [n]
}

const file = process.argv.at(-1)!
const grezzi: Grezzo[] = JSON.parse(readFileSync(file, 'utf8'))
const editorConfig = await editorConfigFactory.default({ config: await config })

const avvisi = grezzi.map((a) => {
  let html = pulisci(a.html)
  // Gli allegati (campi ACF) finiscono in fondo al testo come elenco di link:
  // per l'anteprima i file restano sul sito attuale.
  if (a.allegati.length > 0) {
    html += `<h3>Allegati</h3><ul>${a.allegati
      .map((x) => `<li><a href="${escape(dominio(x.url))}">${escape(x.nome)}</a></li>`)
      .join('')}</ul>`
  }
  const contenuto = convertHTMLToLexical({ editorConfig, html, JSDOM })
  correggiLink(contenuto.root as unknown as Nodo)
  return {
    wpId: a.wpId,
    titolo: a.titolo,
    slug: a.slug,
    data: daRoma(a.data),
    sommario: a.sommario && a.sommario.length > 240 ? `${a.sommario.slice(0, 237).replace(/\s+\S*$/, '')}…` : a.sommario,
    categorie: a.categorie,
    scuole: a.scuole,
    contenuto,
  }
})

avvisi.sort((x, y) => y.data.localeCompare(x.data))
const out = new URL('../../src/seed/avvisi-wp.json.gz', import.meta.url)
writeFileSync(out, gzipSync(JSON.stringify(avvisi)))
console.log(`${avvisi.length} avvisi scritti in src/seed/avvisi-wp.json.gz`)
process.exit(0)
