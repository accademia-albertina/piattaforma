import type { Where } from 'payload'

import { CATEGORIA_AMMISSIONI } from '@/access/avvisi'
import type { Avviso, Media, Scuola } from '@/payload-types'

import { payloadClient } from './payload'

export type AvvisoAmmissione = Pick<Avviso, 'id' | 'titolo' | 'pubblicatoIl' | 'contenuto'> & {
  allegati: {
    nome: string
    url: string
    filename?: string | null
    mimeType?: string | null
    filesize?: number | null
  }[]
}

export type GruppoAmmissioni = {
  scuola: Pick<Scuola, 'id' | 'nome' | 'slug'>
  avvisi: AvvisoAmmissione[]
}

/** Inizio del giorno: un avviso "visibile fino al 20" resta online per tutto il 20. */
const inizioGiorno = (d: Date) => {
  const g = new Date(d)
  g.setHours(0, 0, 0, 0)
  return g
}

/** Avvisi di ammissione pubblicati e non scaduti, raggruppati per scuola (in ordine di nome). */
export async function avvisiAmmissioni(ora = new Date()): Promise<GruppoAmmissioni[]> {
  const payload = await payloadClient()
  const where: Where = {
    and: [
      { categorie: { contains: CATEGORIA_AMMISSIONI } },
      {
        or: [
          { visibileFinoAl: { exists: false } },
          { visibileFinoAl: { greater_than_equal: inizioGiorno(ora).toISOString() } },
        ],
      },
    ],
  }
  const { docs } = await payload.find({
    collection: 'avvisi',
    where,
    sort: '-pubblicatoIl',
    limit: 200,
    pagination: false,
    depth: 1,
    overrideAccess: false,
    select: {
      titolo: true,
      pubblicatoIl: true,
      contenuto: true,
      allegati: true,
      scuole: true,
    },
  })
  return raggruppaPerScuola(docs)
}

export function raggruppaPerScuola(
  docs: Pick<Avviso, 'id' | 'titolo' | 'pubblicatoIl' | 'contenuto' | 'allegati' | 'scuole'>[],
): GruppoAmmissioni[] {
  const gruppi = new Map<number, GruppoAmmissioni>()
  for (const a of docs) {
    const avviso: AvvisoAmmissione = {
      id: a.id,
      titolo: a.titolo,
      pubblicatoIl: a.pubblicatoIl,
      contenuto: a.contenuto,
      allegati: (a.allegati ?? []).flatMap((x) => {
        const f = x.file as Media | number
        return typeof f === 'object' && f?.url
          ? [
              {
                nome: x.nome,
                url: f.url,
                filename: f.filename,
                mimeType: f.mimeType,
                filesize: f.filesize,
              },
            ]
          : []
      }),
    }
    for (const s of a.scuole ?? []) {
      if (typeof s !== 'object' || !s) continue
      const g = gruppi.get(s.id) ?? { scuola: { id: s.id, nome: s.nome, slug: s.slug }, avvisi: [] }
      g.avvisi.push(avviso)
      gruppi.set(s.id, g)
    }
  }
  return [...gruppi.values()].sort((a, b) => a.scuola.nome.localeCompare(b.scuola.nome, 'it'))
}
