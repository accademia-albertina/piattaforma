/**
 * Sincronizzazione dei file dal sito WordPress: si può rilanciare quante volte serve.
 *
 * 1. Legge l'elenco dei media pubblici di WordPress (API REST).
 * 2. Per ogni file: se non c'è ancora (campo wpId) lo scarica, se la data di modifica è cambiata
 *    lo sostituisce, altrimenti lo salta. Il file passa da un file temporaneo su disco e va su
 *    Drive a blocchi: in memoria non c'è mai un file intero (server da 512 MB).
 * 3. Riscrive i link a wp-content/uploads nei contenuti (tutte le collezioni e i globali).
 *
 * Gira in background, un file alla volta; l'avanzamento si vede in /admin/drive.
 */
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { CollectionSlug, GlobalSlug, Payload } from 'payload'
import sharp from 'sharp'

import { CAMPO_DRIVE, caricaSuDrive, cartellaLocale } from '@/lib/drive/adattatore'
import { togliDallaCache } from '@/lib/drive/cache'
import { driveCollegato } from '@/lib/drive/connessione'
import { altDaNomeFile } from '@/utilities/testoAlternativo'

import { riscriviLink, type MappaFile } from './riscrivi'
import {
  chiaveWp,
  chiediAWp,
  elencoMediaWp,
  RE_LINK_WP,
  type MediaWp,
  nomeFileDaWp,
} from './wordpress'

export type StatoSincronizzazione = {
  inCorso: boolean
  fase: 'elenco' | 'file' | 'link' | 'finito'
  avviatoIl?: string
  finitoIl?: string
  /** Prova: solo i primi N file da importare. */
  limite?: number
  suWordPress: number
  daFare: number
  fatti: number
  nuovi: number
  aggiornati: number
  invariati: number
  errori: string[]
  /** File importati che su WordPress non ci sono più (non si cancellano). */
  toltiDaWp: number
  contenutiAggiornati: number
  linkRiscritti: number
  /** Link a WordPress rimasti, senza file corrispondente (primi 50). */
  linkNonTrovati: string[]
  linkNonTrovatiTotale: number
  /** Contenuti non salvati (es. bozze o campi non validi), con il motivo. */
  contenutiNonSalvati: string[]
}

const vuoto = (): StatoSincronizzazione => ({
  inCorso: false,
  fase: 'finito',
  suWordPress: 0,
  daFare: 0,
  fatti: 0,
  nuovi: 0,
  aggiornati: 0,
  invariati: 0,
  errori: [],
  toltiDaWp: 0,
  contenutiAggiornati: 0,
  linkRiscritti: 0,
  linkNonTrovati: [],
  linkNonTrovatiTotale: 0,
  contenutiNonSalvati: [],
})

let stato: StatoSincronizzazione = vuoto()
let interrompi = false

export const statoSincronizzazione = () => stato

/** Collezioni che non contengono link a WordPress (o dati personali da non toccare). */
const ESCLUSE = new Set([
  'media',
  'users',
  'email-inviate',
  'iscrizioni-corsi',
  'iscrizioni-esami',
  'finestre-iscrizione',
  'registro-attivita',
])
const GLOBALI_ESCLUSI = new Set(['drive-connessione'])

const ERRORI_MAX = 30

export function avviaSincronizzazione(
  payload: Payload,
  o: { limite?: number; fetch?: typeof fetch } = {},
) {
  if (stato.inCorso) return false
  interrompi = false
  stato = {
    ...vuoto(),
    inCorso: true,
    fase: 'elenco',
    avviatoIl: new Date().toISOString(),
    limite: o.limite,
  }
  void sincronizza(payload, o)
    .catch((e) => {
      stato.errori.push((e as Error).message)
      payload.logger.error(`Importazione da WordPress: ${(e as Error).message}`)
    })
    .finally(() => {
      stato.inCorso = false
      stato.fase = 'finito'
      stato.finitoIl = new Date().toISOString()
      payload.logger.info(
        `Importazione da WordPress finita: ${stato.nuovi} nuovi, ${stato.aggiornati} aggiornati, ${stato.invariati} invariati, ${stato.errori.length} errori; ${stato.linkRiscritti} link riscritti in ${stato.contenutiAggiornati} contenuti`,
      )
    })
  return true
}

/** Ferma la sincronizzazione dopo il file in corso (si riprende rilanciandola). */
export function fermaSincronizzazione() {
  if (stato.inCorso) interrompi = true
}

/** Per i test: attende la fine della sincronizzazione in corso. */
export async function attendiSincronizzazione() {
  while (stato.inCorso) await new Promise((r) => setTimeout(r, 20))
}

type DocMedia = {
  id: number
  filename?: string | null
  wpId?: number | null
  wpModificato?: string | null
  [CAMPO_DRIVE]?: string | null
}

async function sincronizza(payload: Payload, o: { limite?: number; fetch?: typeof fetch }) {
  const f = o.fetch ?? fetch
  const wp = await elencoMediaWp({ fetch: f })
  stato.suWordPress = wp.length

  const { docs } = await payload.find({
    collection: 'media',
    where: { wpId: { exists: true } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { filename: true, wpId: true, wpModificato: true, [CAMPO_DRIVE]: true },
  })
  const importati = new Map((docs as DocMedia[]).map((d) => [d.wpId!, d]))
  const idWp = new Set(wp.map((m) => m.id))
  stato.toltiDaWp = [...importati.keys()].filter((id) => !idWp.has(id)).length

  // Prima i file collegati nei contenuti (il sito si sistema subito, e la prova con pochi file
  // mostra link riscritti), poi gli altri; a parità, dai più recenti.
  const collegati = await chiaviCollegate(payload)
  const peso = (m: MediaWp) => (collegati.has(chiaveWp(m.url)) ? 0 : 1)
  let daFare = wp
    .filter((m) => importati.get(m.id)?.wpModificato !== m.modificato)
    .sort((a, b) => peso(a) - peso(b) || b.id - a.id)
  stato.invariati = wp.length - daFare.length
  if (o.limite) daFare = daFare.slice(0, o.limite)
  stato.daFare = daFare.length
  stato.fase = 'file'

  const drive = await driveCollegato(payload).catch(() => null)
  if (!drive) payload.logger.warn('Importazione da WordPress: Drive non collegato, file sul disco')

  for (const m of daFare) {
    if (interrompi) break
    try {
      const esistente = importati.get(m.id)
      await importaFile(payload, m, esistente, f)
      if (esistente) stato.aggiornati++
      else stato.nuovi++
    } catch (e) {
      stato.errori.push(`${m.url}: ${(e as Error).message}`)
      // Se WordPress o Drive non rispondono è inutile insistere: si riprende rilanciando
      if (stato.errori.length >= ERRORI_MAX) {
        stato.errori.push('Troppi errori: importazione interrotta. Riprova più tardi.')
        break
      }
    }
    stato.fatti++
  }

  stato.fase = 'link'
  await riscriviContenuti(payload)
}

/** Nome libero nella collezione media (quello di WordPress, o con l'ID davanti se c'è già). */
async function nomeLibero(payload: Payload, m: MediaWp) {
  const base = nomeFileDaWp(m.url)
  for (const nome of [base, `wp${m.id}-${base}`]) {
    const { totalDocs } = await payload.count({
      collection: 'media',
      where: { filename: { equals: nome } },
      overrideAccess: true,
    })
    if (totalDocs === 0) return nome
  }
  return `wp${m.id}-${Date.now()}-${base}`
}

async function scarica(url: string, destinazione: string, f: typeof fetch) {
  const r = await chiediAWp(url, { timeout: 5 * 60_000 }, f)
  if (!r.ok || !r.body) throw new Error(`download ${r.status}`)
  await pipeline(
    Readable.fromWeb(r.body as import('node:stream/web').ReadableStream),
    createWriteStream(destinazione),
  )
}

async function dimensioniImmagine(p: string, mimeType: string) {
  if (!mimeType.startsWith('image/')) return {}
  try {
    // Legge solo l'intestazione del file, non decodifica l'immagine
    const { width, height } = await sharp(p).metadata()
    return { width: width ?? null, height: height ?? null }
  } catch {
    return {}
  }
}

export async function importaFile(
  payload: Payload,
  m: MediaWp,
  esistente: DocMedia | undefined,
  f: typeof fetch,
) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wp-import-'))
  const p = path.join(tmp, 'file')
  try {
    await scarica(m.url, p, f)
    const { size } = await fs.stat(p)
    const filename = esistente?.filename ?? (await nomeLibero(payload, m))
    const idDrive = await caricaSuDrive(payload, { filename, mimeType: m.mimeType, dati: p })
    if (!idDrive) {
      // Drive non collegato (sviluppo) o non disponibile: il file resta sul disco del server,
      // come per i caricamenti dal pannello ("Sposta su Drive" lo porta poi su Drive).
      const dir = cartellaLocale(payload.collections.media.config)
      await fs.mkdir(dir, { recursive: true })
      await fs.copyFile(p, path.join(dir, filename))
    }
    const dati = {
      filename,
      mimeType: m.mimeType,
      filesize: size,
      ...(await dimensioniImmagine(p, m.mimeType)),
      [CAMPO_DRIVE]: idDrive,
      wpId: m.id,
      wpUrl: m.url,
      wpModificato: m.modificato,
      updatedAt: new Date().toISOString(),
    }
    // Scrittura diretta nel database: niente conversione in WebP né caricamento doppio su Drive
    // (l'upload di Payload terrebbe l'intero file in memoria).
    if (esistente) {
      await payload.db.updateOne({ collection: 'media', id: esistente.id, data: dati })
      const vecchio = esistente[CAMPO_DRIVE]
      if (vecchio && vecchio !== idDrive) {
        await togliDallaCache(vecchio).catch(() => undefined)
        const drive = await driveCollegato(payload).catch(() => null)
        await drive?.cestina(vecchio).catch(() => undefined)
      }
    } else {
      await payload.db.create({
        collection: 'media',
        data: {
          ...dati,
          alt: (m.alt || (m.titolo.includes(' ') ? m.titolo : altDaNomeFile(filename))).slice(
            0,
            200,
          ),
          createdAt: dati.updatedAt,
        },
      })
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true })
  }
}

/** Indirizzo pubblico di un file della collezione media (come lo genera Payload). */
export const urlFile = (filename: string) => `/api/media/file/${encodeURIComponent(filename)}`

export async function mappaFile(payload: Payload): Promise<MappaFile> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { wpUrl: { exists: true } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { filename: true, wpUrl: true, alt: true },
  })
  const mappa: MappaFile = new Map()
  type Riga = { id: number; filename?: string | null; wpUrl?: string | null; alt?: string | null }
  for (const d of docs as Riga[]) {
    if (d.wpUrl && d.filename)
      mappa.set(chiaveWp(d.wpUrl), {
        id: d.id,
        url: urlFile(d.filename),
        nome: d.alt?.trim() || d.filename,
      })
  }
  return mappa
}

const CONTESTO = { importazione: true, riscritturaWp: true }

function annota(nonTrovati: string[]) {
  stato.linkNonTrovatiTotale += nonTrovati.length
  for (const l of nonTrovati) {
    if (stato.linkNonTrovati.length >= 50) break
    if (!stato.linkNonTrovati.includes(l)) stato.linkNonTrovati.push(l)
  }
}

/** Solo i campi di primo livello cambiati (gli altri non si rimandano al salvataggio). */
function differenze(prima: Record<string, unknown>, dopo: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(dopo)) {
    if (JSON.stringify(prima[k]) !== JSON.stringify(dopo[k])) out[k] = dopo[k]
  }
  return out
}

/** Collezioni di contenuti in cui cercare i link (con o senza bozze). */
const collezioniContenuti = (payload: Payload) =>
  payload.config.collections
    .filter((c) => !ESCLUSE.has(c.slug) && !c.slug.startsWith('payload-'))
    .map((c) => ({ slug: c.slug as CollectionSlug, bozze: Boolean(c.versions?.drafts) }))

/** Chiavi dei file WordPress collegati nei contenuti (per importarli per primi). */
async function chiaviCollegate(payload: Payload) {
  const chiavi = new Set<string>()
  const raccogli = (doc: unknown) => {
    for (const [link] of JSON.stringify(doc).matchAll(new RegExp(RE_LINK_WP.source, 'gi')))
      chiavi.add(chiaveWp(link))
  }
  for (const { slug, bozze } of collezioniContenuti(payload)) {
    for (let pagina = 1, pagine = 1; pagina <= pagine; pagina++) {
      const r = await payload.find({
        collection: slug,
        depth: 0,
        limit: 100,
        page: pagina,
        sort: 'id',
        draft: bozze,
        overrideAccess: true,
      })
      pagine = r.totalPages
      r.docs.forEach(raccogli)
    }
  }
  for (const g of payload.config.globals) {
    if (!GLOBALI_ESCLUSI.has(g.slug))
      raccogli(
        await payload.findGlobal({ slug: g.slug as GlobalSlug, depth: 0, overrideAccess: true }),
      )
  }
  return chiavi
}

/** Riscrive i link in tutte le collezioni di contenuti e nei globali. */
export async function riscriviContenuti(payload: Payload) {
  const mappa = await mappaFile(payload)

  for (const { slug, bozze } of collezioniContenuti(payload)) {
    for (let pagina = 1, pagine = 1; pagina <= pagine; pagina++) {
      const r = await payload.find({
        collection: slug,
        depth: 0,
        limit: 50,
        page: pagina,
        sort: 'id',
        draft: bozze,
        overrideAccess: true,
      })
      pagine = r.totalPages
      for (const doc of r.docs as unknown as Record<string, unknown>[]) {
        if (!JSON.stringify(doc).includes('wp-content/uploads')) continue
        const esito = riscriviLink(doc, mappa)
        annota(esito.nonTrovati)
        if (!esito.cambiati) continue
        const data = differenze(doc, esito.valore as Record<string, unknown>)
        try {
          await payload.update({
            collection: slug,
            id: doc.id as number,
            data,
            depth: 0,
            overrideAccess: true,
            // Una bozza resta bozza: la versione pubblicata si aggiorna alla pubblicazione
            ...(bozze ? { draft: doc._status === 'draft' } : {}),
            context: CONTESTO,
          })
          stato.contenutiAggiornati++
          stato.linkRiscritti += esito.cambiati
        } catch (e) {
          stato.contenutiNonSalvati.push(`${slug} ${doc.id}: ${(e as Error).message}`)
        }
      }
    }
  }

  for (const g of payload.config.globals) {
    if (GLOBALI_ESCLUSI.has(g.slug)) continue
    const slug = g.slug as GlobalSlug
    const doc = (await payload.findGlobal({
      slug,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
    if (!JSON.stringify(doc).includes('wp-content/uploads')) continue
    const esito = riscriviLink(doc, mappa)
    annota(esito.nonTrovati)
    if (!esito.cambiati) continue
    try {
      await payload.updateGlobal({
        slug,
        data: differenze(doc, esito.valore as Record<string, unknown>),
        depth: 0,
        overrideAccess: true,
        context: CONTESTO,
      })
      stato.contenutiAggiornati++
      stato.linkRiscritti += esito.cambiati
    } catch (e) {
      stato.contenutiNonSalvati.push(`${slug}: ${(e as Error).message}`)
    }
  }
}
