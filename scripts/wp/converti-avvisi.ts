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

import { correggiLink, daRoma, dominio, escape, type Nodo, pulisci } from './html'

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
    sommario:
      a.sommario && a.sommario.length > 240
        ? `${a.sommario.slice(0, 237).replace(/\s+\S*$/, '')}…`
        : a.sommario,
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
