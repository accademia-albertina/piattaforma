/**
 * Conversione dei contenuti WordPress nei dati delle collezioni. I link ai file restano
 * indirizzi di WordPress: li sostituisce poi la mappa dei file importati (riscriviLink).
 */
import type { SanitizedConfig } from 'payload'

import { datiAtto, datiVoce, type AttoWp } from '@/seed/albo-trasparenza-wp'
import { SCUOLE } from '@/seed/scuole-wp'
import type { Avviso } from '@/payload-types'
import { inFrase } from '@/utilities/maiuscole'

import { decodifica, type AvvisoRest, type TrasparenzaRest } from './fonti'

/** Cambia quando cambia la conversione: i contenuti non presi in carico si riallineano. */
export const VERSIONE = 'c1'

const MAX_TITOLO = 160

/** Categorie WordPress (nome) → categoria degli avvisi. */
const CATEGORIE: Record<string, Avviso['categorie'][number]> = {
  'In evidenza': 'in-evidenza',
  Generali: 'generali',
  Lezioni: 'lezioni',
  Esami: 'esami',
  Eventi: 'eventi',
  'Bandi e concorsi': 'bandi-e-concorsi',
  'Iscrizioni A.A.': 'iscrizioni',
  Coordinatori: 'coordinatori',
  Tasse: 'tasse',
}

/** Categorie degli avvisi che esistono anche su WordPress (le altre sono solo del nuovo sito). */
export const CATEGORIE_WP = new Set<string>(Object.values(CATEGORIE))

/** Tag WordPress (nome) → chiave della scuola. */
const TAG_SCUOLE: Record<string, keyof typeof SCUOLE> = {
  PAI: 'pai',
  NTA: 'nta',
  Grafica: 'grafica',
  Comunicazione: 'comunicazione',
  Pittura: 'pittura',
  Decorazione: 'decorazione',
  Scenografia: 'scenografia',
  Cinema: 'cinema',
  Didattica: 'didattica',
  Scultura: 'scultura',
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Pulizia dell'HTML prima della conversione (come scripts/wp/html.ts). */
export function pulisciHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/https?:\/\/(www\.)?newalbertina\.eu/g, 'https://albertina-academy.it')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '')
    .replace(/ /g, ' ')
    .trim()
}

type NodoLexical = { type?: string; children?: NodoLexical[]; fields?: { url?: string } }

/** Link scritti male nel sito attuale (come correggiLink di scripts/wp/html.ts). */
function correggiLink(n: NodoLexical): NodoLexical[] {
  const figli = n.children?.flatMap(correggiLink)
  if (figli) n.children = figli
  if (n.type !== 'link' || !n.fields) return [n]
  let url = (n.fields.url ?? '').trim().split(/\s+/)[0] ?? ''
  if (/^h*ttps?:\/\//.test(url)) url = url.replace(/^h*ttp/, 'http')
  else if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(url)) url = `mailto:${url}`
  else if (url.startsWith('/')) url = `https://albertina-academy.it${url}`
  if (!/^(https?:\/\/|mailto:|tel:)/.test(url)) return n.children ?? []
  n.fields.url = url
  return [n]
}

let editor: Promise<unknown> | null = null

/** HTML → testo formattato (Lexical). jsdom si carica solo quando serve. */
export async function htmlInLexical(html: string, config: SanitizedConfig) {
  const [{ JSDOM }, lexical] = await Promise.all([
    import('jsdom'),
    import('@payloadcms/richtext-lexical'),
  ])
  editor ??= lexical.editorConfigFactory.default({ config })
  const contenuto = lexical.convertHTMLToLexical({
    editorConfig: (await editor) as Parameters<
      typeof lexical.convertHTMLToLexical
    >[0]['editorConfig'],
    html,
    JSDOM,
  })
  correggiLink(contenuto.root as unknown as NodoLexical)
  return contenuto as unknown as Avviso['contenuto']
}

export type AllegatoWp = { nome: string; idWp: number }

/** Allegati di un avviso (campi ACF documento, documento_2… documento_5). */
export function allegatiAvviso(a: AvvisoRest): AllegatoWp[] {
  const acf = a.acf ?? {}
  const out: AllegatoWp[] = []
  for (const suf of ['', '_2', '_3', '_4', '_5']) {
    const id = Number(acf[`documento${suf}`])
    if (!Number.isInteger(id) || id <= 0) continue
    out.push({ nome: String(acf[`nome_allegato${suf}`] ?? '').trim(), idWp: id })
  }
  return out
}

/** Dati di un avviso, senza file (allegati e immagine li aggiunge la sincronizzazione). */
export async function datiAvviso(
  a: AvvisoRest,
  t: { categorie: Map<number, string>; tag: Map<number, string>; scuole: Map<string, number> },
  config: SanitizedConfig,
) {
  const categorie = [
    ...new Set(a.categories.map((id) => CATEGORIE[t.categorie.get(id) ?? '']).filter(Boolean)),
  ].sort()
  const scuole = [
    ...new Set(
      a.tags
        .map((id) => TAG_SCUOLE[t.tag.get(id) ?? ''])
        .filter(Boolean)
        .map((k) => t.scuole.get(SCUOLE[k]))
        .filter((id): id is number => typeof id === 'number'),
    ),
  ]
  return {
    titolo: inFrase(decodifica(a.title.raw ?? a.title.rendered)).slice(0, MAX_TITOLO),
    slug: a.slug,
    categorie: (categorie.length ? categorie : ['generali']) as Avviso['categorie'],
    scuole,
    pubblicatoIl: new Date(`${a.date_gmt}Z`).toISOString(),
    contenuto: await htmlInLexical(pulisciHtml(a.content.rendered), config),
  }
}

/** Elenco di link in fondo al testo, per gli allegati il cui file non c'è (già rotto su WP). */
export function htmlAllegatiMancanti(allegati: { nome: string; url: string }[]) {
  return `<h3>Allegati</h3><ul>${allegati
    .map((x) => `<li><a href="${escape(x.url)}">${escape(x.nome)}</a></li>`)
    .join('')}</ul>`
}

/** "2026-10-21T15:12:26" (ora di Roma) → ISO in UTC, con l'ora legale giusta. */
export function daRoma(locale: string) {
  const comeUtc = new Date(`${locale.replace(' ', 'T')}Z`)
  const roma = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'Europe/Rome' }))
  const utc = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(comeUtc.getTime() - (roma.getTime() - utc.getTime())).toISOString()
}

/**
 * Dati di una sottosezione della trasparenza, come l'importazione iniziale. `urlMedia` dà
 * l'indirizzo WordPress di un file caricato (dal suo ID), o undefined se non esiste più.
 */
export function datiTrasparenza(
  v: TrasparenzaRest,
  sezioni: Map<number, string>,
  urlMedia: Map<number, string>,
) {
  const righe = Array.isArray(v.acf?.documenti_da_allegare) ? v.acf.documenti_da_allegare : []
  const documenti: { nome: string; url: string; nota: string }[] = []
  for (const r of righe) {
    let nome = (r.nome_documento ?? '').trim()
    const nota = (r.testo ?? '').trim()
    let url = ''
    if (r.ti_occorre_inserire_un_link === 'Si' && (r.link ?? '').trim()) {
      url = (r.link ?? '').trim()
      nome = (r.nome_del_link ?? '').trim() || nome
    } else if (Number(r.documento) > 0) {
      url = urlMedia.get(Number(r.documento)) ?? ''
    }
    if (nome || url || nota)
      documenti.push({ nome: nome || (url ? url.split('/').pop()! : ''), url, nota })
  }
  const sezione = sezioni.get(v['amministrazione-trasparente'][0]) ?? ''
  const dati = datiVoce({
    wpId: v.id,
    titolo: decodifica(v.title.rendered),
    slug: v.slug,
    sezione,
    aggiornatoIl: v.modified,
    documenti,
  })
  return dati && { ...dati, aggiornatoIl: daRoma(v.modified) }
}

/** ID dei file WordPress usati da una sottosezione della trasparenza. */
export const fileTrasparenza = (v: TrasparenzaRest) =>
  (Array.isArray(v.acf?.documenti_da_allegare) ? v.acf.documenti_da_allegare : [])
    .filter((r) => !(r.ti_occorre_inserire_un_link === 'Si' && (r.link ?? '').trim()))
    .map((r) => Number(r.documento))
    .filter((n) => Number.isInteger(n) && n > 0)

export { datiAtto, type AttoWp }
