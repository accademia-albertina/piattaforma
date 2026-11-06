/**
 * Converte le schede delle scuole del sito attuale (scuole.json dal thread Assistenza) nel
 * formato Lexical e scrive src/seed/scuole-contenuti.json.gz. Uso:
 *   pnpm payload run scripts/wp/converti-scuole.ts <scuole.json> <docenti-profili.csv>
 */
import config from '@payload-config'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

import { correggiLink, dominio, type Nodo, pulisci } from './html'

type Riga = { testo: string; link: string | null }
type Grezza = {
  slug: string
  titolo: string
  schede: {
    scheda: string
    sezioni: { titolo: string | null; html: string }[]
    piani_di_studio?: { righe: Riga[][] }[]
  }[]
  coordinatori: Record<string, { slug_docente: string }[]>
  video?: { youtube_id?: string | null } | null
}

const [fileScuole, fileCsv] = process.argv.slice(-2)
const grezze: Grezza[] = JSON.parse(readFileSync(fileScuole, 'utf8'))

// slug WordPress del docente (f.bosisio) → email istituzionale, dal CSV dei profili (f-bosisio)
const righeCsv = readFileSync(fileCsv, 'utf8').split('\n').slice(1)
const emailDa = new Map<string, string>()
for (const r of righeCsv) {
  const [, slug, , , , , email] = r.split(',')
  if (slug && email) emailDa.set(slug, email.trim())
}
const email = (slugWp?: string) =>
  slugWp ? (emailDa.get(slugWp.replace(/\./g, '-')) ?? null) : null

const editorConfig = await editorConfigFactory.default({ config: await config })
const lexical = (html: string) => {
  const c = convertHTMLToLexical({ editorConfig, html: pulisci(html), JSDOM })
  correggiLink(c.root as unknown as Nodo)
  return c
}

// Testo semplice dall'HTML: lo estrae il parser, non una regex sui tag
const testo = (s: string) =>
  (JSDOM.fragment(s).textContent ?? '').replace(/\s+/g, ' ').trim()

/** Titoli vuoti o generati da Breakdance nel sito attuale. */
const titoloSezione = (t: string | null) => {
  if (!t) return 'Indirizzi'
  if (t.includes('breakdance_dynamic') || t.startsWith('Regolamento didattico'))
    return 'Regolamento didattico'
  return t.trim()
}

// Cinema ha una seconda scheda copiata da Nuove Tecnologie (biennio non attivo); il suo video
// è lo stesso di Scenografia: non si importano.
const SENZA_BIENNIO = new Set(['cinema-fotografia-e-audiovisivo'])
const VIDEO_DUBBI = new Set(['cinema-fotografia-e-audiovisivo'])

const percorso = (s: Grezza, nome: 'Triennio' | 'Biennio') => {
  const scheda = s.schede.find((x) => x.scheda === nome)
  if (!scheda || (nome === 'Biennio' && SENZA_BIENNIO.has(s.slug))) return { attivo: false }
  const piani = (scheda.piani_di_studio ?? []).flatMap(({ righe }) => {
    const [coorti = [], file = []] = righe
    return file.flatMap((f, i) => {
      if (!f.link) return []
      const coorte = testo(coorti[i]?.testo ?? '')
      const breve = coorte.replace(
        /^Immatricolati a partire dall.A\.A\./i,
        'immatricolati dall’A.A.',
      )
      return [{ nome: [testo(f.testo), breve].filter(Boolean).join(' – '), url: dominio(f.link) }]
    })
  })
  return {
    attivo: true,
    sezioni: scheda.sezioni
      .filter((x) => testo(x.html))
      .map((x) => ({ titolo: titoloSezione(x.titolo), testo: lexical(x.html) })),
    piani,
  }
}

const scuole = grezze.map((s) => ({
  slug: s.slug,
  video:
    s.video?.youtube_id && !VIDEO_DUBBI.has(s.slug)
      ? `https://www.youtube.com/watch?v=${s.video.youtube_id}`
      : null,
  triennio: percorso(s, 'Triennio'),
  biennio: percorso(s, 'Biennio'),
  coordinatoreDipartimento: email(s.coordinatori['Coordinatore dipartimento']?.[0]?.slug_docente),
  coordinatoreScuola: email(s.coordinatori['Coordinatore scuola']?.[0]?.slug_docente),
}))

const out = new URL('../../src/seed/scuole-contenuti.json.gz', import.meta.url)
writeFileSync(out, gzipSync(JSON.stringify(scuole)))
for (const s of scuole)
  console.log(
    s.slug,
    'T',
    s.triennio.sezioni?.length ?? '-',
    'B',
    s.biennio.sezioni?.length ?? '-',
    'piani',
    (s.triennio.piani?.length ?? 0) + (s.biennio.piani?.length ?? 0),
    'coord',
    s.coordinatoreDipartimento,
    s.coordinatoreScuola,
  )
process.exit(0)
