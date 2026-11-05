/**
 * Converte i profili dei dottorandi estratti da WordPress nel formato della collezione Dottorandi
 * e scrive src/seed/dottorandi-wp.json.gz. Uso:
 *   python3 scripts/wp/estrai-pagine.py --dottorandi > /tmp/dottorandi-wp.json
 *   pnpm payload run scripts/wp/converti-dottorandi.ts /tmp/dottorandi-wp.json
 * Sul sito attuale ogni profilo è un testo unico: "Biografia", poi "Titolo progetto: …" e
 * "Abstract: …". Qui diventano campi separati.
 */
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

import { correggiLink, escape, type Nodo, pulisci } from './html'

type Grezza = {
  wpId: number
  titolo: string
  slug: string
  blocchi: (
    | { tipo: 'contatti'; voci: { nome: string; email?: string | null }[] }
    | { tipo: 'testo'; html: string }
  )[]
}

// Cognomi composti: il resto del titolo è il nome
const COGNOMI: Record<string, string> = {
  'Maria Luigia Gioffrè': 'Gioffrè',
  'Natalia Moncada Bustamante': 'Moncada Bustamante',
  'Sofia Baldi Pighi': 'Baldi Pighi',
}

const file = process.argv.at(-1)!
const grezze: Grezza[] = JSON.parse(readFileSync(file, 'utf8'))
const editorConfig = await editorConfigFactory.default({ config: await config })

const lexical = (html: string) => {
  if (!html.trim()) return null
  const valore = convertHTMLToLexical({ editorConfig, html: pulisci(html), JSDOM })
  correggiLink(valore.root as unknown as Nodo)
  return valore
}

const senzaAccenti = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Sul sito attuale alcuni profili hanno l'email di un altro dottorando (copia e incolla):
// un'email ripetuta resta solo a chi ha il cognome nell'indirizzo.
const email = (g: Grezza) =>
  g.blocchi.flatMap((b) => (b.tipo === 'contatti' ? b.voci : [])).find((v) => v.email)?.email ??
  null
const conteggio = new Map<string, number>()
for (const g of grezze) {
  const e = email(g)
  if (e) conteggio.set(e, (conteggio.get(e) ?? 0) + 1)
}

const dottorandi = grezze.map((g) => {
  const titolo = g.titolo.trim()
  const cognome = COGNOMI[titolo] ?? titolo.split(/\s+/).at(-1)!
  const nome = titolo.slice(0, titolo.length - cognome.length).trim()

  let mail = email(g)
  if (mail && conteggio.get(mail)! > 1) {
    const locale = mail.split('@')[0]
    if (!locale.includes(senzaAccenti(cognome).replace(/\s+/g, ''))) {
      console.warn(`${titolo}: email ${mail} di un altro dottorando, non importata`)
      mail = null
    }
  }

  const html = g.blocchi.map((b) => (b.tipo === 'testo' ? b.html : '')).join('')
  const { document } = new JSDOM(`<body>${html}</body>`).window
  const bio: string[] = []
  const abstract: string[] = []
  let titoloProgetto: string | null = null
  let supervisor: string | null = null
  let cosupervisor: string | null = null
  let parte: 'bio' | 'abstract' = 'bio'
  for (const el of Array.from(document.body.children)) {
    // "Supervisor: …" e "Co-supervisor: …" sono righe in fondo all'abstract: vanno nei loro campi
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/)
      .filter((riga) => {
        // Testo della riga letto dal DOM, non togliendo i tag con una regex
        const contenitore = document.createElement('div')
        contenitore.innerHTML = riga
        const t = contenitore.textContent?.trim() ?? ''
        const m = /^(co-?)?supervisor\s*:\s*(.+)$/i.exec(t)
        if (!m) return true
        if (m[1]) cosupervisor = m[2].trim()
        else supervisor = m[2].trim()
        return false
      })
      .join('<br>')
    // Righe incollate senza a capo: "…culturale.Supervisor: Prof. X (…)Co-supervisor: …"
    el.innerHTML = el.innerHTML.replace(
      /(Co-?)?Supervisor:\s*([^<]*?)(?=(?:Co-?)?Supervisor:|<|$)/gi,
      (_, co: string | undefined, nome: string) => {
        if (co) cosupervisor = nome.trim()
        else supervisor = nome.trim()
        return ''
      },
    )
    if (!el.textContent?.trim()) continue
    const testo = el.textContent?.trim() ?? ''
    if (/^biografia:?$/i.test(testo)) continue
    const t = /^titolo (del )?progetto:\s*/i.exec(testo)
    if (t) {
      titoloProgetto = testo.slice(t[0].length).trim() || null
      continue
    }
    const a = /^abstract:\s*/i.exec(testo)
    if (a) {
      parte = 'abstract'
      const resto = testo.slice(a[0].length).trim()
      if (resto) abstract.push(`<p>${escape(resto)}</p>`)
      continue
    }
    ;(parte === 'bio' ? bio : abstract).push(el.outerHTML)
  }

  return {
    wpId: g.wpId,
    slugWp: g.slug,
    nome,
    cognome,
    email: mail,
    titoloProgetto,
    supervisor,
    cosupervisor,
    biografia: lexical(bio.join('')),
    abstract: lexical(abstract.join('')),
  }
})

writeFileSync(
  new URL('../../src/seed/dottorandi-wp.json.gz', import.meta.url),
  gzipSync(JSON.stringify(dottorandi)),
)
console.log(`ok: ${dottorandi.length} dottorandi`)
process.exit(0)
