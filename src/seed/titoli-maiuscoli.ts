/**
 * Riscrive i titoli tutti in maiuscolo già salvati (importati dal sito attuale) in minuscolo
 * con l'iniziale maiuscola. Tocca solo i titoli maiuscoli: si può rilanciare a ogni avvio.
 */
import type { CollectionSlug, Payload } from 'payload'

import { inFrase, tuttoMaiuscolo } from '@/utilities/maiuscole'

const COLLEZIONI = ['avvisi', 'albo', 'trasparenza', 'pagine', 'corsi', 'calendari'] as const

export async function correggiTitoliMaiuscoli(payload: Payload) {
  let corretti = 0
  for (const collection of COLLEZIONI) {
    const { docs } = await payload.find({
      collection: collection as CollectionSlug,
      pagination: false,
      depth: 0,
      select: { titolo: true },
      overrideAccess: true,
    })
    for (const d of docs as { id: number; titolo?: string }[]) {
      if (!d.titolo || !tuttoMaiuscolo(d.titolo)) continue
      try {
        await payload.update({
          collection: collection as CollectionSlug,
          id: d.id,
          data: { titolo: inFrase(d.titolo) },
          context: { importazione: true },
          overrideAccess: true,
        })
        corretti++
      } catch (e) {
        payload.logger.warn(`Titolo ${collection} ${d.id} non corretto: ${(e as Error).message}`)
      }
    }
  }
  if (corretti) payload.logger.info(`Titoli in maiuscolo riscritti: ${corretti}.`)
}
