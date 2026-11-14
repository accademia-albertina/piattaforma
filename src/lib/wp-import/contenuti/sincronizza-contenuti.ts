/**
 * Sincronizzazione dei contenuti dal sito WordPress: Albo online, Amministrazione trasparente e
 * avvisi. Si può rilanciare quante volte serve, fino al passaggio al nuovo sito.
 *
 * - Ogni contenuto importato ricorda l'elemento WordPress da cui viene (wpId) e una sua impronta
 *   (versione della conversione + data di modifica su WP, o hash dell'atto per l'Albo).
 * - Nuovo su WordPress → si crea. Impronta cambiata → si aggiorna. Uguale → si salta.
 * - Modificato nel pannello (spunta "Modificato nel pannello") → non si tocca mai: se nel
 *   frattempo è cambiato anche su WordPress finisce nell'elenco "da controllare a mano".
 * - Tolto da WordPress → resta qui ed è segnalato (l'Albo ha valore legale: niente cancellazioni
 *   automatiche).
 * - I file collegati si importano da WordPress se mancano e i link puntano ai file del nuovo sito.
 *
 * La prima volta collega i contenuti dell'importazione iniziale (src/seed/) ai loro elementi
 * WordPress: un contenuto ancora uguale a quello importato si può aggiornare; uno diverso è stato
 * modificato nel pannello e resta com'è.
 *
 * Gira in background sul server (512 MB): un elemento alla volta, file in streaming.
 */
import { createHash } from 'node:crypto'

import type { CollectionSlug, Payload } from 'payload'

import { PAGINE_ALBO, attiDaPagina } from './albo-html'
import {
  allegatiAvviso,
  CATEGORIE_WP,
  datiAtto,
  datiAvviso,
  datiTrasparenza,
  fileTrasparenza,
  htmlAllegatiMancanti,
  htmlInLexical,
  VERSIONE,
  type AttoWp,
} from './converti'
import {
  decodifica,
  elencoLeggero,
  pagine as elencoPagine,
  pagineAlbo,
  perId,
  termini,
  type AvvisoRest,
  type TrasparenzaRest,
} from './fonti'
import { riscriviLink, type MappaFile } from '../riscrivi'
import { importaFile, mappaFile, urlFile } from '../sincronizza'
import { chiaveWp, elencoMediaWp, mediaWpPerId, type MediaWp } from '../wordpress'
import { attiSeed, datiVoce, vociSeed } from '@/seed/albo-trasparenza-wp'
import { slugAvvisiSeed } from '@/seed/avvisi-wp'
import { inFrase } from '@/utilities/maiuscole'
import { slugify } from '@/utilities/slugify'

export type Raccolta = 'albo' | 'trasparenza' | 'avvisi'

export type EsitoRaccolta = {
  suWordPress: number
  nuovi: number
  aggiornati: number
  invariati: number
  /** Collegati per la prima volta a WordPress (contenuti dell'importazione iniziale). */
  collegati: number
  /** Presi in carico nel pannello: non si toccano. */
  protetti: number
  /** …e cambiati anche su WordPress dopo: da controllare a mano (primi 100). */
  daControllare: string[]
  /** Importati ma tolti (o non più pubblici) su WordPress: restano qui (primi 100). */
  nonPiuSuWp: string[]
  nonPiuSuWpTotale: number
  errori: string[]
}

export type StatoContenuti = {
  inCorso: boolean
  fase: Raccolta | 'pagine' | 'finito'
  avviatoIl?: string
  finitoIl?: string
  /** Prova: al massimo N elementi da creare o aggiornare per raccolta. */
  limite?: number
  fatti: number
  daFare: number
  albo: EsitoRaccolta
  trasparenza: EsitoRaccolta
  avvisi: EsitoRaccolta
  /** Pagine WordPress modificate dopo l'importazione iniziale: si riportano a mano. */
  pagineModificate: { titolo: string; url: string; modificato: string }[]
  fileImportati: number
  errori: string[]
}

const esitoVuoto = (): EsitoRaccolta => ({
  suWordPress: 0,
  nuovi: 0,
  aggiornati: 0,
  invariati: 0,
  collegati: 0,
  protetti: 0,
  daControllare: [],
  nonPiuSuWp: [],
  nonPiuSuWpTotale: 0,
  errori: [],
})

const vuoto = (): StatoContenuti => ({
  inCorso: false,
  fase: 'finito',
  fatti: 0,
  daFare: 0,
  albo: esitoVuoto(),
  trasparenza: esitoVuoto(),
  avvisi: esitoVuoto(),
  pagineModificate: [],
  fileImportati: 0,
  errori: [],
})

/** Data dell'export del database WordPress usato per l'importazione iniziale delle pagine. */
export const DATA_IMPORT_PAGINE = '2026-10-21T00:00:00'

const MAX_ELENCO = 100
const ERRORI_MAX = 30
const CONTESTO = { importazione: true }

let stato: StatoContenuti = vuoto()
let interrompi = false

export const statoContenuti = () => stato

export function avviaSincronizzazioneContenuti(
  payload: Payload,
  o: { limite?: number; fetch?: typeof fetch; solo?: Raccolta[] } = {},
) {
  if (stato.inCorso) return false
  interrompi = false
  stato = {
    ...vuoto(),
    inCorso: true,
    fase: 'albo',
    avviatoIl: new Date().toISOString(),
    limite: o.limite,
  }
  void sincronizza(payload, o)
    .catch((e) => {
      stato.errori.push((e as Error).message)
      payload.logger.error(`Sincronizzazione contenuti da WordPress: ${(e as Error).message}`)
    })
    .finally(() => {
      stato.inCorso = false
      stato.fase = 'finito'
      stato.finitoIl = new Date().toISOString()
      const r = (k: Raccolta) =>
        `${k} ${stato[k].nuovi} nuovi, ${stato[k].aggiornati} aggiornati, ${stato[k].protetti} protetti`
      payload.logger.info(
        `Sincronizzazione contenuti finita: ${r('albo')}; ${r('trasparenza')}; ${r('avvisi')}`,
      )
    })
  return true
}

export function fermaSincronizzazioneContenuti() {
  if (stato.inCorso) interrompi = true
}

export async function attendiSincronizzazioneContenuti() {
  while (stato.inCorso) await new Promise((r) => setTimeout(r, 20))
}

// ---------------------------------------------------------------------------------------------

type Doc = Record<string, unknown> & {
  id: number
  wpId?: string | null
  wpImpronta?: string | null
  modificatoNelPannello?: boolean | null
  _status?: string | null
}

const hash = (v: unknown) => createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 16)

/** Valore confrontabile: senza gli id delle righe e con vuoti uniformi. */
function normalizza(v: unknown): unknown {
  if (v === undefined || v === '' || v === null) return null
  // Date salvate a mezzanotte UTC: "2025-12-18" e "2025-12-18T00:00:00.000Z" sono uguali
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(v))
    return v.slice(0, 10)
  if (Array.isArray(v)) return v.map(normalizza)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(o)
        .filter((k) => k !== 'id')
        .sort()
        .map((k) => [k, normalizza(o[k])])
        .filter(([, x]) => x !== null),
    )
  }
  return v
}

const uguali = (a: unknown, b: unknown) =>
  JSON.stringify(normalizza(a)) === JSON.stringify(normalizza(b))

/** Righe documento come nel database (con `file`), così la riscrittura le trasforma in file. */
const conFile = <T extends { documenti: object[] }>(d: T): T => ({
  ...d,
  documenti: d.documenti.map((r) => ({ file: null, ...r })),
})

const confronta = (doc: Doc, attesi: Record<string, unknown>) =>
  Object.keys(attesi).every((k) => uguali(doc[k], attesi[k]))

/** Contesto di una passata: mappa dei file e import dei file mancanti. */
class File {
  private elenco: Promise<Map<string, MediaWp>> | null = null
  constructor(
    private payload: Payload,
    public mappa: MappaFile,
    private f: typeof fetch,
  ) {}

  private async importa(m: MediaWp) {
    await importaFile(this.payload, m, undefined, this.f)
    const { docs } = await this.payload.find({
      collection: 'media',
      where: { wpId: { equals: m.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const d = docs[0]
    if (d?.filename)
      this.mappa.set(chiaveWp(m.url), {
        id: d.id,
        url: urlFile(d.filename),
        nome: d.alt?.trim() || d.filename,
      })
    stato.fileImportati++
  }

  /** Indirizzo WordPress di un file dal suo ID (importandolo se manca). */
  async urlDaId(id: number): Promise<string | undefined> {
    const { docs } = await this.payload.find({
      collection: 'media',
      where: { wpId: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { wpUrl: true },
    })
    if (docs[0]?.wpUrl) return docs[0].wpUrl
    const m = await mediaWpPerId(id, { fetch: this.f })
    if (!m) return undefined
    await this.importa(m)
    return m.url
  }

  /** Importa i file WordPress collegati in un valore e non ancora presenti. */
  async completa(valore: unknown) {
    const mancanti = [
      ...new Set(
        [...JSON.stringify(valore).matchAll(/https?:\/\/[^"\s]*?\/wp-content\/uploads\/[^"\s<>]+/g)]
          .map(([l]) => chiaveWp(l))
          .filter((k) => !this.mappa.has(k)),
      ),
    ]
    if (!mancanti.length) return
    this.elenco ??= elencoMediaWp({ fetch: this.f }).then(
      (tutti) => new Map(tutti.map((m) => [chiaveWp(m.url), m])),
    )
    const elenco = await this.elenco
    for (const k of mancanti) {
      const m = elenco.get(k)
      if (m) await this.importa(m)
    }
  }

  /** Come la riscrittura già fatta sui contenuti esistenti: solo i file già importati. */
  riscriviCome<T>(valore: T): T {
    return riscriviLink(valore, this.mappa).valore as T
  }

  /** Link a WordPress → file del nuovo sito (dopo aver importato quelli mancanti). */
  async riscrivi<T>(valore: T): Promise<T> {
    await this.completa(valore)
    return riscriviLink(valore, this.mappa).valore as T
  }
}

type Elemento = {
  wpId: string
  impronta: string
  modificato?: string
  etichetta: string
  /** Dati da salvare (solo se serve creare o aggiornare). */
  dati: () => Promise<Record<string, unknown> | null>
}

/** Contenuti già collegati: solo i campi che servono (gli avvisi sono più di mille). */
async function docsCollegati(payload: Payload, collection: CollectionSlug) {
  const { docs } = await payload.find({
    collection,
    where: { wpId: { exists: true } },
    pagination: false,
    depth: 0,
    draft: true,
    overrideAccess: true,
    select: {
      titolo: true,
      wpId: true,
      wpImpronta: true,
      modificatoNelPannello: true,
      _status: true,
      ...(collection === 'avvisi' ? { categorie: true } : {}),
    },
  })
  return new Map((docs as unknown as Doc[]).map((d) => [d.wpId as string, d]))
}

async function docsSenzaWp(payload: Payload, collection: CollectionSlug) {
  const { docs } = await payload.find({
    collection,
    where: { or: [{ wpId: { exists: false } }, { wpId: { equals: null } }] },
    pagination: false,
    depth: 0,
    draft: true,
    overrideAccess: true,
    // Per gli avvisi basta lo slug (non si confrontano i testi)
    ...(collection === 'avvisi'
      ? { select: { slug: true, titolo: true, categorie: true, _status: true } }
      : {}),
  })
  return docs as unknown as Doc[]
}

/** Contenuti salvati nel pannello da una persona (registro attività, dal 13/11/2026). */
async function toccatiNelPannello(payload: Payload, collezione: CollectionSlug) {
  const { docs } = await payload.find({
    collection: 'registro-attivita',
    where: {
      collezione: { equals: collezione },
      azione: { in: ['modificato', 'pubblicato', 'ritirato'] },
    },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { documentoId: true },
  })
  return new Set(docs.map((d) => String(d.documentoId)))
}

/**
 * Collega un contenuto dell'importazione iniziale al suo elemento WordPress. Se è ancora
 * uguale a come è stato importato si aggiornerà; altrimenti è stato modificato nel pannello.
 */
async function collega(
  payload: Payload,
  collection: CollectionSlug,
  doc: Doc,
  wpId: string,
  intatto: boolean,
  esito: EsitoRaccolta,
) {
  await payload.update({
    collection,
    id: doc.id,
    data: { wpId, wpImpronta: null, modificatoNelPannello: !intatto },
    depth: 0,
    overrideAccess: true,
    draft: doc._status === 'draft',
    context: CONTESTO,
  })
  doc.wpId = wpId
  doc.wpImpronta = null
  doc.modificatoNelPannello = !intatto
  esito.collegati++
}

/** Contenuti dell'importazione iniziale che su WordPress non si trovano più (es. titolo cambiato). */
function segnalaRimasti(esito: EsitoRaccolta, collection: CollectionSlug, docs: Doc[]) {
  for (const doc of docs) {
    esito.nonPiuSuWpTotale++
    if (esito.nonPiuSuWp.length < MAX_ELENCO)
      esito.nonPiuSuWp.push(
        `${String(doc.titolo ?? doc.id)} (/admin/collections/${collection}/${doc.id})`,
      )
  }
}

async function applica(
  payload: Payload,
  collection: CollectionSlug,
  elementi: Elemento[],
  collegati: Map<string, Doc>,
  esito: EsitoRaccolta,
  limite: number | undefined,
) {
  esito.suWordPress = elementi.length
  const daFare = elementi.filter((e) => {
    const doc = collegati.get(e.wpId)
    if (doc && doc.wpImpronta === e.impronta) {
      esito.invariati++
      return false
    }
    if (doc?.modificatoNelPannello) {
      esito.protetti++
      // Cambiato su WordPress dopo la presa in carico (o mai allineato): da controllare
      if (doc.wpImpronta !== e.impronta && esito.daControllare.length < MAX_ELENCO)
        esito.daControllare.push(`${e.etichetta} (/admin/collections/${collection}/${doc.id})`)
      return false
    }
    return true
  })
  const lavoro = limite ? daFare.slice(0, limite) : daFare
  stato.daFare += lavoro.length
  for (const e of lavoro) {
    if (interrompi) break
    const doc = collegati.get(e.wpId)
    try {
      const dati = await e.dati()
      if (!dati) continue
      const comuni = {
        ...dati,
        wpId: e.wpId,
        wpImpronta: e.impronta,
        wpModificato: e.modificato ?? null,
        modificatoNelPannello: false,
        _status: 'published' as const,
      }
      if (doc) {
        await payload.update({
          collection,
          id: doc.id,
          data: comuni,
          depth: 0,
          overrideAccess: true,
          draft: false,
          context: CONTESTO,
        })
        esito.aggiornati++
      } else {
        await payload.create({
          collection,
          data: comuni as never,
          depth: 0,
          overrideAccess: true,
          draft: false,
          context: CONTESTO,
        })
        esito.nuovi++
      }
    } catch (err) {
      esito.errori.push(`${e.etichetta}: ${(err as Error).message}`)
      if (esito.errori.length >= ERRORI_MAX) {
        esito.errori.push('Troppi errori: sincronizzazione interrotta. Riprova più tardi.')
        interrompi = true
      }
    }
    stato.fatti++
  }
  // Importati che su WordPress non ci sono più
  const presenti = new Set(elementi.map((e) => e.wpId))
  for (const [wpId, doc] of collegati) {
    if (presenti.has(wpId)) continue
    esito.nonPiuSuWpTotale++
    if (esito.nonPiuSuWp.length < MAX_ELENCO)
      esito.nonPiuSuWp.push(
        `${String(doc.titolo ?? wpId)} (/admin/collections/${collection}/${doc.id})`,
      )
  }
}

// --- Albo ------------------------------------------------------------------------------------

const normaTitolo = (t: string) => inFrase(t).slice(0, 300).trim().toLowerCase()
const chiaveAtto = (a: {
  sezione: string
  categoria: string
  anno?: string | null
  titolo: string
}) => `${a.sezione}|${a.categoria}|${a.anno ?? ''}|${normaTitolo(a.titolo)}`

/** ID stabile di un atto: le pagine dell'Albo non hanno un ID per atto. */
export function idAtti(atti: AttoWp[]) {
  const visti = new Map<string, number>()
  return atti.map((a) => {
    const k = chiaveAtto(a)
    const n = (visti.get(k) ?? 0) + 1
    visti.set(k, n)
    return `albo:${hash(k)}${n > 1 ? `-${n}` : ''}`
  })
}

async function sincronizzaAlbo(payload: Payload, file: File, f: typeof fetch, limite?: number) {
  const { JSDOM } = await import('jsdom')
  const atti: AttoWp[] = []
  for (const p of await pagineAlbo({ fetch: f })) {
    const sezione = PAGINE_ALBO[p.id]
    if (!sezione) continue
    const { window } = new JSDOM(p.content.rendered)
    atti.push(...attiDaPagina(window.document as never, sezione))
    window.close()
  }
  if (!atti.length) throw new Error('Albo: nessun atto letto da WordPress')
  const id = idAtti(atti)
  const collegati = await docsCollegati(payload, 'albo')

  // Prima volta: collega gli atti dell'importazione iniziale (stessa sezione, categoria, anno, titolo)
  const liberi = await docsSenzaWp(payload, 'albo')
  if (liberi.length) {
    const toccati = await toccatiNelPannello(payload, 'albo')
    const seed = new Map<string, AttoWp[]>()
    for (const a of attiSeed()) seed.set(chiaveAtto(a), [...(seed.get(chiaveAtto(a)) ?? []), a])
    const perChiave = new Map<string, Doc[]>()
    for (const d of liberi.sort((x, y) => x.id - y.id)) {
      const k = chiaveAtto({
        sezione: String(d.sezione),
        categoria: String(d.categoria),
        anno: (d.annoAccademico as string) ?? null,
        titolo: String(d.titolo),
      })
      perChiave.set(k, [...(perChiave.get(k) ?? []), d])
    }
    for (let i = 0; i < atti.length; i++) {
      if (collegati.has(id[i])) continue
      const k = chiaveAtto(atti[i])
      const doc = perChiave.get(k)?.shift()
      if (!doc) continue
      const originale = seed.get(k)?.shift()
      const intatto =
        !toccati.has(String(doc.id)) &&
        !!originale &&
        confronta(doc, file.riscriviCome(conFile(datiAttoConfronto(originale))))
      await collega(payload, 'albo', doc, id[i], intatto, stato.albo)
      collegati.set(id[i], doc)
    }
    // Rimasti senza corrispondenza ma venuti dall'importazione iniziale: segnalati, non toccati
    segnalaRimasti(
      stato.albo,
      'albo',
      [...perChiave].filter(([k]) => seed.has(k)).flatMap(([, d]) => d),
    )
  }

  const elementi: Elemento[] = atti.map((a, i) => ({
    wpId: id[i],
    impronta: `${VERSIONE}:${hash(a)}`,
    etichetta: `${a.categoria} – ${inFrase(a.titolo).slice(0, 120)}`,
    dati: async () => {
      const d = datiAtto(a)
      return file.riscrivi({
        ...conFile(d),
        // Atto nuovo senza file datati: oggi
        pubblicatoIl: a.pubblicatoIl ?? new Date().toISOString().slice(0, 10),
      })
    },
  }))
  await applica(payload, 'albo', elementi, collegati, stato.albo, limite)
}

const datiAttoConfronto = (a: AttoWp) => {
  const { pubblicatoIl: _p, ...resto } = datiAtto(a)
  return resto
}

// --- Trasparenza -----------------------------------------------------------------------------

async function sincronizzaTrasparenza(
  payload: Payload,
  file: File,
  f: typeof fetch,
  limite?: number,
) {
  const elenco = await elencoLeggero('amm-trasparente', { fetch: f })
  const collegati = await docsCollegati(payload, 'trasparenza')

  const liberi = await docsSenzaWp(payload, 'trasparenza')
  if (liberi.length) {
    const toccati = await toccatiNelPannello(payload, 'trasparenza')
    const seed = new Map(vociSeed().map((v) => [v.wpId, v]))
    const perSlug = new Map(liberi.map((d) => [String(d.slug), d]))
    for (const r of elenco) {
      const wpId = String(r.id)
      if (collegati.has(wpId)) continue
      const doc = perSlug.get(slugify(r.slug))
      if (!doc) continue
      perSlug.delete(String(doc.slug))
      const originale = seed.get(r.id)
      // Lo slug si confronta già con slugify (quelli lunghi vengono accorciati al salvataggio)
      const attesi = originale && datiVoce({ ...originale, slug: String(doc.slug) })
      const intatto =
        !toccati.has(String(doc.id)) &&
        !!attesi &&
        confronta(doc, file.riscriviCome(conFile(attesi)))
      await collega(payload, 'trasparenza', doc, wpId, intatto, stato.trasparenza)
      collegati.set(wpId, doc)
    }
    const slugSeed = new Set(vociSeed().map((v) => slugify(v.slug)))
    segnalaRimasti(
      stato.trasparenza,
      'trasparenza',
      [...perSlug.values()].filter((d) => slugSeed.has(String(d.slug))),
    )
  }

  const impronta = (r: { modificato: string }) => `${VERSIONE}:${r.modificato}`
  const cambiati = elenco.filter((r) => collegati.get(String(r.id))?.wpImpronta !== impronta(r))
  const completi = new Map(
    (
      await perId<TrasparenzaRest>(
        'amm-trasparente',
        cambiati.map((r) => r.id),
        { fetch: f },
      )
    ).map((v) => [v.id, v]),
  )
  const sezioni = cambiati.length
    ? await termini('amministrazione-trasparente', { fetch: f })
    : new Map<number, string>()

  const elementi: Elemento[] = elenco.map((r) => ({
    wpId: String(r.id),
    impronta: impronta(r),
    modificato: r.modificato,
    etichetta: decodifica(completi.get(r.id)?.title.rendered ?? r.slug),
    dati: async () => {
      const v = completi.get(r.id)
      if (!v) return null
      const urlMedia = new Map<number, string>()
      for (const idFile of fileTrasparenza(v)) {
        const url = await file.urlDaId(idFile)
        if (url) urlMedia.set(idFile, url)
      }
      const dati = datiTrasparenza(v, sezioni, urlMedia)
      if (!dati)
        throw new Error(`sezione “${sezioni.get(v['amministrazione-trasparente'][0])}” sconosciuta`)
      return file.riscrivi(conFile(dati))
    },
  }))
  await applica(payload, 'trasparenza', elementi, collegati, stato.trasparenza, limite)
}

// --- Avvisi ----------------------------------------------------------------------------------

async function sincronizzaAvvisi(payload: Payload, file: File, f: typeof fetch, limite?: number) {
  const elenco = await elencoLeggero('avviso', { fetch: f })
  const collegati = await docsCollegati(payload, 'avvisi')

  // Prima volta: collega gli avvisi già presenti con lo stesso slug di WordPress. Qui non si
  // confronta con l'importazione iniziale: alcuni avvisi vengono dai contenuti demo e altri sono
  // stati spostati nella categoria Biblioteca. Contano solo i salvataggi nel registro attività.
  const liberi = await docsSenzaWp(payload, 'avvisi')
  if (liberi.length) {
    const toccati = await toccatiNelPannello(payload, 'avvisi')
    const perSlug = new Map(liberi.map((d) => [String(d.slug), d]))
    for (const r of elenco) {
      const wpId = String(r.id)
      if (collegati.has(wpId)) continue
      const doc = perSlug.get(slugify(r.slug))
      if (!doc) continue
      perSlug.delete(String(doc.slug))
      await collega(payload, 'avvisi', doc, wpId, !toccati.has(String(doc.id)), stato.avvisi)
      collegati.set(wpId, doc)
    }
    const slugSeed = slugAvvisiSeed()
    segnalaRimasti(
      stato.avvisi,
      'avvisi',
      [...perSlug.values()].filter((d) => slugSeed.has(String(d.slug))),
    )
  }

  const impronta = (r: { modificato: string }) => `${VERSIONE}:${r.modificato}`
  let cambiati = elenco.filter((r) => {
    const doc = collegati.get(String(r.id))
    return doc?.wpImpronta !== impronta(r) && !doc?.modificatoNelPannello
  })
  // Prova: si leggono da WordPress solo quelli che si importeranno (i più recenti)
  if (limite) cambiati = cambiati.sort((a, b) => b.id - a.id).slice(0, limite)
  const completi = new Map<number, AvvisoRest>()
  let t: Parameters<typeof datiAvviso>[1] | null = null
  if (cambiati.length) {
    const scuole = await payload.find({ collection: 'scuole', pagination: false, depth: 0 })
    t = {
      categorie: await termini('categories', { fetch: f }),
      tag: await termini('tags', { fetch: f }),
      scuole: new Map(scuole.docs.map((s) => [s.nome, s.id])),
    }
  }

  const ordinati = [...elenco].sort((a, b) => b.id - a.id)
  const elementi: Elemento[] = ordinati.map((r) => ({
    wpId: String(r.id),
    impronta: impronta(r),
    modificato: r.modificato,
    etichetta: String(collegati.get(String(r.id))?.titolo ?? `Avviso “${r.slug}”`),
    dati: async () => {
      // Si leggono a blocchi, quando servono (in memoria non c'è mai l'elenco completo)
      if (!completi.has(r.id)) {
        const i = cambiati.findIndex((c) => c.id === r.id)
        const blocco = cambiati
          .slice(i, i + 50)
          .map((c) => c.id)
          .filter((id) => !completi.has(id))
        completi.clear()
        for (const a of await perId<AvvisoRest>('avviso', blocco.length ? blocco : [r.id], {
          fetch: f,
        }))
          completi.set(a.id, a)
      }
      const a = completi.get(r.id)
      if (!a || !t) return null
      const dati = await datiAvvisoCompleti(payload, a, t, file)
      const prima = (collegati.get(String(r.id))?.categorie as string[] | undefined) ?? []
      const proprie = prima.filter((c) => !CATEGORIE_WP.has(c))
      if (proprie.length) {
        const daWp = dati.categorie.filter((c) => c !== 'generali')
        dati.categorie = [...new Set([...daWp, ...proprie])].sort() as typeof dati.categorie
      }
      return dati
    },
  }))
  // L'ordine di lettura deve seguire quello di `cambiati`
  cambiati.sort((a, b) => b.id - a.id)
  await applica(payload, 'avvisi', elementi, collegati, stato.avvisi, limite)
}

async function datiAvvisoCompleti(
  payload: Payload,
  a: AvvisoRest,
  t: Parameters<typeof datiAvviso>[1],
  file: File,
) {
  const dati = await datiAvviso(a, t, payload.config)
  const allegati: { nome: string; file: number }[] = []
  const mancanti: { nome: string; url: string }[] = []
  for (const x of allegatiAvviso(a)) {
    const url = await file.urlDaId(x.idWp)
    const riga = (await file.riscrivi({ file: null, url })) as { file?: number | null }
    const nome = x.nome || (url ? decodeURIComponent(url.split('/').pop() ?? '') : '') || 'Allegato'
    if (riga.file) allegati.push({ nome, file: riga.file })
    else if (url) mancanti.push({ nome, url })
  }
  let contenuto = dati.contenuto
  if (mancanti.length) {
    const extra = await htmlInLexical(htmlAllegatiMancanti(mancanti), payload.config)
    const root = (contenuto as { root: { children: unknown[] } }).root
    root.children.push(...(extra as { root: { children: unknown[] } }).root.children)
  }
  let immagine: number | null = null
  if (a.featured_media > 0) {
    const url = await file.urlDaId(a.featured_media)
    const r = url ? ((await file.riscrivi({ file: null, url })) as { file?: number | null }) : null
    immagine = r?.file ?? null
  }
  contenuto = await file.riscrivi(contenuto)
  return { ...dati, contenuto, allegati, immagine }
}

// --- Pagine ----------------------------------------------------------------------------------

async function paginePerControllo(f: typeof fetch) {
  const tutte = await elencoPagine({ fetch: f })
  stato.pagineModificate = tutte
    .filter((p) => p.modified_gmt > DATA_IMPORT_PAGINE)
    .sort((a, b) => b.modified_gmt.localeCompare(a.modified_gmt))
    .map((p) => ({
      titolo: decodifica(p.title.rendered),
      url: p.link,
      modificato: new Date(`${p.modified_gmt}Z`).toISOString(),
    }))
}

// ---------------------------------------------------------------------------------------------

async function sincronizza(
  payload: Payload,
  o: { limite?: number; fetch?: typeof fetch; solo?: Raccolta[] },
) {
  const f = o.fetch ?? fetch
  const file = new File(payload, await mappaFile(payload), f)
  const fa = (r: Raccolta) => !o.solo || o.solo.includes(r)
  const passi: [Raccolta, () => Promise<void>][] = [
    // Prima l'Albo: ha valore legale
    ['albo', () => sincronizzaAlbo(payload, file, f, o.limite)],
    ['trasparenza', () => sincronizzaTrasparenza(payload, file, f, o.limite)],
    ['avvisi', () => sincronizzaAvvisi(payload, file, f, o.limite)],
  ]
  for (const [r, passo] of passi) {
    if (interrompi || !fa(r)) continue
    stato.fase = r
    try {
      await passo()
    } catch (e) {
      stato[r].errori.push((e as Error).message)
    }
  }
  if (!interrompi && !o.solo) {
    stato.fase = 'pagine'
    await paginePerControllo(f).catch((e) => stato.errori.push(`Pagine: ${(e as Error).message}`))
  }
}
