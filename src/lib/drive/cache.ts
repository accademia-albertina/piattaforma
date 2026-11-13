/**
 * Cache su disco dei file scaricati da Drive: il primo visitatore attende Drive, gli altri
 * ricevono il file dal disco del server. Quando supera il limite si tolgono i file usati meno
 * di recente. Davanti c'è anche la cache del browser/CDN (intestazioni Cache-Control).
 *
 * DRIVE_CACHE_DIR: cartella (predefinita: accanto a MEDIA_DIR, o nella cartella temporanea).
 * DRIVE_CACHE_MB: dimensione massima, predefinita 2048 MB.
 */
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export const cartellaCache = () =>
  process.env.DRIVE_CACHE_DIR ||
  (process.env.MEDIA_DIR
    ? path.join(path.dirname(process.env.MEDIA_DIR), 'cache-drive')
    : path.join(os.tmpdir(), 'albertina-cache-drive'))

const limite = () => (Number(process.env.DRIVE_CACHE_MB) || 2048) * 1024 * 1024

/** Gli ID di Drive sono alfanumerici con - e _: niente percorsi strani. */
const percorso = (id: string) => {
  if (!/^[\w-]+$/.test(id)) throw new Error('ID di Drive non valido')
  return path.join(cartellaCache(), id)
}

const inCorso = new Map<string, Promise<string>>()

/**
 * Percorso del file in cache; se manca lo scarica con `scarica` (una sola volta anche con
 * più richieste contemporanee).
 */
export async function fileInCache(id: string, scarica: () => Promise<Response>): Promise<string> {
  const p = percorso(id)
  try {
    const ora = new Date()
    await fs.utimes(p, ora, ora) // segna l'uso, per tenere i file più richiesti
    return p
  } catch {
    // non in cache
  }
  const attesa = inCorso.get(id)
  if (attesa) return attesa
  const lavoro = (async () => {
    await fs.mkdir(cartellaCache(), { recursive: true })
    const r = await scarica()
    if (!r.body) throw new Error('Drive: risposta vuota')
    const temporaneo = `${p}.${process.pid}.${Date.now()}.part`
    try {
      await pipeline(Readable.fromWeb(r.body as never), createWriteStream(temporaneo))
      await fs.rename(temporaneo, p)
    } catch (e) {
      await fs.rm(temporaneo, { force: true })
      throw e
    }
    void pulisciCache().catch(() => undefined)
    return p
  })().finally(() => inCorso.delete(id))
  inCorso.set(id, lavoro)
  return lavoro
}

export async function togliDallaCache(id: string) {
  await fs.rm(percorso(id), { force: true })
}

/** Oltre il limite toglie i file usati meno di recente. */
export async function pulisciCache(max = limite()) {
  const dir = cartellaCache()
  const nomi = await fs.readdir(dir).catch(() => [] as string[])
  const file = (
    await Promise.all(
      nomi
        .filter((n) => !n.endsWith('.part'))
        .map(async (n) => {
          const s = await fs.stat(path.join(dir, n)).catch(() => null)
          return s ? { p: path.join(dir, n), size: s.size, uso: s.mtimeMs } : null
        }),
    )
  ).filter((f): f is { p: string; size: number; uso: number } => f !== null)
  let totale = file.reduce((t, f) => t + f.size, 0)
  for (const f of file.sort((a, b) => a.uso - b.uso)) {
    if (totale <= max) break
    await fs.rm(f.p, { force: true })
    totale -= f.size
  }
}
