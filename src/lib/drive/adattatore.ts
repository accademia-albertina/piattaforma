/**
 * Adattatore di archiviazione per @payloadcms/plugin-cloud-storage: i file caricati dal
 * pannello vanno nella cartella Drive (DRIVE_ID → sottocartella "media") e il sito li serve
 * da /api/media/file/<nome> passando dalla cache su disco.
 *
 * Se Drive non è collegato (sviluppo, test, collegamento revocato) o non risponde, il file
 * resta sul disco del server come prima: il caricamento non fallisce mai per colpa di Drive.
 * I file rimasti sul disco si spostano poi con "Sposta su Drive" in /admin/drive.
 */
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'

import type { Adapter, File } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig, CollectionSlug, FileData, Payload, PayloadRequest } from 'payload'

import { fileInCache, togliDallaCache } from './cache'
import { cartellaMedia, driveCollegato } from './connessione'

export const CAMPO_DRIVE = 'driveFileId'

/** Cartella dei file sul disco del server (stessa regola di Payload). */
export const cartellaLocale = (collection: CollectionConfig) =>
  path.resolve(
    (typeof collection.upload === 'object' && collection.upload.staticDir) || collection.slug,
  )

function percorsoLocale(collection: CollectionConfig, filename: string) {
  const dir = cartellaLocale(collection)
  const p = path.resolve(dir, filename)
  if (!p.startsWith(dir + path.sep)) throw new Error('Nome file non valido')
  return p
}

async function contenuto(file: File) {
  if (file.buffer?.length) return file.buffer
  if (file.tempFilePath) return fs.readFile(file.tempFilePath)
  return file.buffer
}

/** Carica su Drive; restituisce l'ID o null (Drive non collegato o in errore). */
export async function caricaSuDrive(
  payload: Payload,
  o: { filename: string; mimeType: string; dati: Buffer },
): Promise<string | null> {
  try {
    const drive = await driveCollegato(payload)
    if (!drive) return null
    return await drive.carica({
      nome: o.filename,
      mimeType: o.mimeType,
      dati: o.dati,
      padre: await cartellaMedia(payload, drive),
    })
  } catch (e) {
    payload.logger.error(
      `Drive: caricamento di ${o.filename} non riuscito, resta sul disco: ${(e as Error).message}`,
    )
    return null
  }
}

async function cestina(payload: Payload, id: string) {
  await togliDallaCache(id).catch(() => undefined)
  try {
    const drive = await driveCollegato(payload)
    await drive?.cestina(id)
  } catch (e) {
    payload.logger.error(`Drive: file ${id} non spostato nel cestino: ${(e as Error).message}`)
  }
}

const SETTIMANA = 7 * 24 * 3600

function intestazioni(o: {
  mimeType?: string | null
  dimensione: number
  etag: string
  req: PayloadRequest
}) {
  const h = new Headers({
    'Content-Type': o.mimeType || 'application/octet-stream',
    'Content-Length': String(o.dimensione),
    ETag: o.etag,
    // Un giorno di cache fresca, poi una settimana in cui si serve la copia e si ricontrolla
    'Cache-Control': `public, max-age=86400, stale-while-revalidate=${SETTIMANA}`,
    'X-Content-Type-Options': 'nosniff',
    // Come Payload: niente script dentro SVG o PDF serviti dal sito
    'Content-Security-Policy': "script-src 'none'; frame-src 'none'; object-src 'none'",
  })
  const origine = process.env.NEXT_PUBLIC_SERVER_URL
  if (origine && o.req.headers.get('origin') === origine)
    h.set('Access-Control-Allow-Origin', origine)
  return h
}

export const adattatoreDrive: Adapter = ({ collection }) => ({
  name: 'google-drive',
  fields: [
    {
      name: CAMPO_DRIVE,
      type: 'text',
      label: 'ID del file su Google Drive',
      admin: {
        hidden: true,
        readOnly: true,
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
  ],

  async handleUpload({ data, file, req }) {
    const dati = await contenuto(file)
    const id = await caricaSuDrive(req.payload, {
      filename: file.filename,
      mimeType: file.mimeType,
      dati,
    })
    const precedente = data?.[CAMPO_DRIVE] as string | undefined
    if (precedente && precedente !== id) await cestina(req.payload, precedente)
    // Il plugin salva nel documento ciò che restituiamo (tipizzato solo come FileData)
    if (id) return { [CAMPO_DRIVE]: id } as Partial<FileData>
    // Drive non disponibile: sul disco, come senza adattatore
    const p = percorsoLocale(collection, file.filename)
    await fs.mkdir(path.dirname(p), { recursive: true })
    await fs.writeFile(p, dati)
    return { [CAMPO_DRIVE]: null } as Partial<FileData>
  },

  async handleDelete({ doc, filename, req }) {
    const id = (doc as { [CAMPO_DRIVE]?: string | null })[CAMPO_DRIVE]
    if (id) await cestina(req.payload, id)
    await fs.rm(percorsoLocale(collection, filename), { force: true }).catch(() => undefined)
  },

  // Restituisce undefined per i file ancora sul disco: li serve Payload come sempre.
  staticHandler: (async (req, { doc, params }) => {
    let documento = doc as
      { [CAMPO_DRIVE]?: string | null; mimeType?: string; filename?: string } | undefined
    if (!documento?.filename) {
      documento = (await req.payload.db.findOne({
        collection: collection.slug as CollectionSlug,
        req,
        where: { filename: { equals: params.filename } },
      })) as typeof documento
    }
    const id = documento?.[CAMPO_DRIVE]
    if (!id) return undefined

    const etag = `"${id}"`
    if (req.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }
    try {
      const p = await fileInCache(id, async () => {
        const drive = await driveCollegato(req.payload)
        if (!drive) throw new Error('Drive non collegato')
        return drive.scarica(id)
      })
      const { size } = await fs.stat(p)
      return new Response(Readable.toWeb(createReadStream(p)) as ReadableStream, {
        headers: intestazioni({ mimeType: documento?.mimeType, dimensione: size, etag, req }),
      })
    } catch (e) {
      req.payload.logger.error(`Drive: ${params.filename} non disponibile: ${(e as Error).message}`)
      return new Response('File momentaneamente non disponibile', {
        status: 503,
        headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
      })
    }
  }) as ReturnType<Adapter>['staticHandler'],
})
