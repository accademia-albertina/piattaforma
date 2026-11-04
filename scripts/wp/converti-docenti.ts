/**
 * Converte i profili docenti (JSON da estrai-docenti.py) nel formato Lexical di Payload e scrive
 * src/seed/docenti-wp.json.gz. Uso:
 *   pnpm payload run scripts/wp/converti-docenti.ts <docenti.json>
 */
import config from '@payload-config'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

import { correggiLink, dominio, escape, type Nodo, pulisci } from './html'

type Grezzo = {
  wpId: number
  slugWp: string
  nome: string
  cognome: string
  email: string | null
  ruolo: string | null
  scuole: string[]
  ricevimento: string | null
  foto: string | null
  cv: string | null
  biografia: string | null
}

const file = process.argv.at(-1)!
const grezzi: Grezzo[] = JSON.parse(readFileSync(file, 'utf8'))
const editorConfig = await editorConfigFactory.default({ config: await config })

const docenti = grezzi.map(({ biografia, cv, ...d }) => {
  // Il CV resta per ora un link al PDF sul sito attuale, in fondo alla biografia
  let html = biografia ? pulisci(biografia) : ''
  if (html && !/<(p|h\d|ul|ol)\b/i.test(html)) {
    html = html
      // Nel sito attuale ogni a capo separa un paragrafo
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('')
  }
  if (cv) html += `<p><a href="${escape(dominio(cv))}">Curriculum vitae (PDF)</a></p>`
  let contenuto = null
  if (html) {
    contenuto = convertHTMLToLexical({ editorConfig, html, JSDOM })
    correggiLink(contenuto.root as unknown as Nodo)
  }
  return { ...d, foto: d.foto ? dominio(d.foto) : null, biografia: contenuto }
})

const out = new URL('../../src/seed/docenti-wp.json.gz', import.meta.url)
writeFileSync(out, gzipSync(JSON.stringify(docenti)))
console.log(`${docenti.length} docenti scritti in src/seed/docenti-wp.json.gz`)
process.exit(0)
