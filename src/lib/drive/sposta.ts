/**
 * Sposta su Drive i file caricati prima del collegamento (ancora sul disco del server).
 * Gira in background, uno alla volta; l'avanzamento si vede in /admin/drive.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import { CAMPO_DRIVE, caricaSuDrive, cartellaLocale } from './adattatore'

export type Avanzamento = {
  inCorso: boolean
  totale: number
  spostati: number
  mancanti: string[]
  errori: string[]
  finitoIl?: string
}

let avanzamento: Avanzamento = { inCorso: false, totale: 0, spostati: 0, mancanti: [], errori: [] }

export const statoSpostamento = () => avanzamento

export async function fileSulDisco(payload: Payload) {
  const { totalDocs } = await payload.count({
    collection: 'media',
    where: { or: [{ [CAMPO_DRIVE]: { exists: false } }, { [CAMPO_DRIVE]: { equals: '' } }] },
    overrideAccess: true,
  })
  return totalDocs
}

export function avviaSpostamento(payload: Payload) {
  if (avanzamento.inCorso) return false
  avanzamento = { inCorso: true, totale: 0, spostati: 0, mancanti: [], errori: [] }
  void sposta(payload)
    .catch((e) => avanzamento.errori.push((e as Error).message))
    .finally(() => {
      avanzamento.inCorso = false
      avanzamento.finitoIl = new Date().toISOString()
    })
  return true
}

async function sposta(payload: Payload) {
  const collezione = payload.collections.media.config
  const dir = cartellaLocale(collezione)
  const { docs } = await payload.find({
    collection: 'media',
    where: { or: [{ [CAMPO_DRIVE]: { exists: false } }, { [CAMPO_DRIVE]: { equals: '' } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { filename: true, mimeType: true },
  })
  avanzamento.totale = docs.length
  for (const doc of docs) {
    if (!doc.filename) continue
    const p = path.resolve(dir, doc.filename)
    if (!p.startsWith(dir + path.sep)) continue
    let dati: Buffer
    try {
      dati = await fs.readFile(p)
    } catch {
      avanzamento.mancanti.push(doc.filename)
      continue
    }
    const id = await caricaSuDrive(payload, {
      filename: doc.filename,
      mimeType: doc.mimeType || 'application/octet-stream',
      dati,
    })
    if (!id) {
      avanzamento.errori.push(doc.filename)
      // Se Drive non risponde inutile continuare: si riprova dal pulsante
      if (avanzamento.errori.length >= 5) return
      continue
    }
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { [CAMPO_DRIVE]: id },
      overrideAccess: true,
      depth: 0,
      context: { skipCloudStorage: true },
    })
    await fs.rm(p, { force: true })
    avanzamento.spostati++
  }
}
