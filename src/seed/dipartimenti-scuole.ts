/**
 * Dipartimento di ogni scuola, come sulla pagina /scuole/ del sito attuale.
 * Si scrive solo dove è vuoto: quello scelto nel pannello resta.
 */
import type { Payload } from 'payload'

import type { Scuola } from '@/payload-types'

export const DIPARTIMENTI_SCUOLE: Record<string, NonNullable<Scuola['dipartimento']>> = {
  pittura: 'arti-visive',
  scultura: 'arti-visive',
  'grafica-darte': 'arti-visive',
  decorazione: 'arti-della-progettazione',
  scenografia: 'arti-della-progettazione',
  'progettazione-artistica-per-limpresa': 'arti-della-progettazione',
  'nuove-tecnologie-dellarte': 'arti-tecnologiche',
  'cinema-fotografia-e-audiovisivo': 'arti-tecnologiche',
  'comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo':
    'comunicazione-e-didattica',
  'didattica-dellarte': 'comunicazione-e-didattica',
}

export async function completaDipartimentiScuole(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'scuole',
    where: { slug: { in: Object.keys(DIPARTIMENTI_SCUOLE) } },
    pagination: false,
    depth: 0,
    select: { slug: true, dipartimento: true },
    overrideAccess: true,
  })
  let scritti = 0
  for (const d of docs) {
    if (d.dipartimento || !d.slug) continue
    await payload.update({
      collection: 'scuole',
      id: d.id,
      data: { dipartimento: DIPARTIMENTI_SCUOLE[d.slug] },
      overrideAccess: true,
    })
    scritti++
  }
  if (scritti) payload.logger.info(`Dipartimenti delle scuole completati: ${scritti}.`)
}
