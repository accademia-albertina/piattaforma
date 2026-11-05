import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Payload } from 'payload'

import { normalizzaRighe, type TipoCalendario } from '@/lib/calendari'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Calendari estratti dai PDF della segreteria (scripts/wp/estrai-orario.py). */
const FILE = ['orario-2025-2026.json']

type Dati = {
  tipo: TipoCalendario
  titolo: string
  sottotitolo?: string
  annoAccademico: string
  sedi?: string
  avvertenze?: string
  righe: unknown[]
}

/** Crea i calendari mancanti (stesso tipo, titolo e anno); non tocca quelli già modificati. */
export async function importaCalendari(payload: Payload) {
  for (const nome of FILE) {
    const dati = JSON.parse(readFileSync(path.join(dirname, 'calendari', nome), 'utf8')) as Dati
    const { totalDocs } = await payload.count({
      collection: 'calendari',
      where: {
        tipo: { equals: dati.tipo },
        titolo: { equals: dati.titolo },
        annoAccademico: { equals: dati.annoAccademico },
      },
      overrideAccess: true,
    })
    if (totalDocs > 0) continue
    await payload.create({
      collection: 'calendari',
      data: {
        ...dati,
        righe: normalizzaRighe(dati.tipo, dati.righe),
        _status: 'published',
      },
      overrideAccess: true,
    })
    payload.logger.info(`Calendario importato: ${dati.titolo} ${dati.annoAccademico}`)
  }
}
