/**
 * Converte le pagine estratte da WordPress (scripts/wp/estrai-pagine.py, blocchi con HTML)
 * nei blocchi di Payload e scrive src/seed/pagine-wp.json.gz. Uso:
 *   python3 scripts/wp/estrai-pagine.py > /tmp/pagine-wp.json
 *   pnpm payload run scripts/wp/converti-pagine.ts /tmp/pagine-wp.json
 */
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

import { correggiLink, type Nodo, pulisci } from './html'

type BloccoGrezzo =
  | { tipo: 'testo'; html: string }
  | { tipo: 'fisarmonica'; voci: { titolo: string; html: string }[] }
  | { tipo: 'link'; voci: { etichetta: string; url: string }[] }
  | {
      tipo: 'contatti'
      titolo?: string | null
      voci: { nome: string; email?: string | null; ruolo?: string | null; orari?: string | null }[]
    }

type Grezza = {
  wpId: number
  titolo: string
  percorso: string
  slug: string
  genitore: string | null
  sommario: string | null
  blocchi: BloccoGrezzo[]
}

const file = process.argv.at(-1)!
const grezze: Grezza[] = JSON.parse(readFileSync(file, 'utf8'))
const editorConfig = await editorConfigFactory.default({ config: await config })

// I link alle pagine del sito restano relativi: correggiLink li renderebbe assoluti.
const INTERNO = 'https://interno.invalid'

function relativi(n: Nodo) {
  n.children?.forEach(relativi)
  if (n.type === 'link' && n.fields?.url?.startsWith(INTERNO))
    n.fields.url = n.fields.url.slice(INTERNO.length) || '/'
}

function lexical(html: string) {
  const pulito = pulisci(html)
    .replace(/href="\/(?!\/)/g, `href="${INTERNO}/`)
    .replace(/<a href="#[^"]*"[^>]*>([\s\S]*?)<\/a>/g, '$1') // ancore interne della vecchia pagina
  const valore = convertHTMLToLexical({ editorConfig, html: pulito, JSDOM })
  correggiLink(valore.root as unknown as Nodo)
  relativi(valore.root as unknown as Nodo)
  return valore
}

const tronca = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s

const pagine = grezze.map((g) => ({
  wpId: g.wpId,
  titolo: tronca(g.titolo, 120),
  slug: g.slug,
  percorso: g.percorso,
  genitore: g.genitore,
  sommario: g.sommario ? tronca(g.sommario, 240) : null,
  blocchi: g.blocchi.map((b) => {
    switch (b.tipo) {
      case 'testo':
        return { blockType: 'testo', testo: lexical(b.html) }
      case 'fisarmonica':
        return {
          blockType: 'fisarmonica',
          voci: b.voci.map((v) => ({ titolo: v.titolo || 'Dettagli', testo: lexical(v.html) })),
        }
      case 'link':
        return {
          blockType: 'link',
          voci: b.voci.map((v) => ({
            etichetta: tronca(v.etichetta, 200),
            tipo: v.url.startsWith('/') ? 'percorso' : 'esterno',
            url: v.url,
          })),
        }
      case 'contatti':
        return { blockType: 'contatti', titolo: b.titolo ?? null, voci: b.voci }
    }
  }),
}))

writeFileSync(
  new URL('../../src/seed/pagine-wp.json.gz', import.meta.url),
  gzipSync(JSON.stringify(pagine)),
)
console.log(`ok: ${pagine.length} pagine`)
process.exit(0)
