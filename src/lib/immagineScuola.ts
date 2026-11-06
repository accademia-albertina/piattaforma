import type { Scuola } from '@/payload-types'

import { IMMAGINI_SCUOLE } from './immagini-scuole'

/** Immagine caricata nel pannello, altrimenti la foto di repertorio della scuola. */
export function immagineScuola(s: Pick<Scuola, 'immagine' | 'slug'>) {
  const caricata = typeof s.immagine === 'object' && s.immagine?.url ? s.immagine : null
  return caricata
    ? { url: caricata.url!, width: caricata.width, height: caricata.height }
    : (IMMAGINI_SCUOLE[s.slug ?? ''] ?? null)
}
