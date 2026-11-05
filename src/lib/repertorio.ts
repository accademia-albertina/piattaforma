import type { StaticImageData } from 'next/image'

import aulaPittura from '@/assets/repertorio/aula-pittura.webp'
import cortileIncet from '@/assets/repertorio/cortile-incet.webp'
import pinacoteca from '@/assets/repertorio/pinacoteca.webp'
import salaBlu from '@/assets/repertorio/sala-blu.webp'
import scalone from '@/assets/repertorio/scalone.webp'
import sotterranei from '@/assets/repertorio/sotterranei.webp'

import { IMMAGINI_SCUOLE } from './immagini-scuole'

/** Foto di repertorio delle sedi (scelte da Fede), usate quando un contenuto non ha un'immagine. */
export const REPERTORIO: StaticImageData[] = [
  scalone,
  aulaPittura,
  salaBlu,
  pinacoteca,
  cortileIncet,
  sotterranei,
]

/** Numero stabile da una stringa, così lo stesso avviso ha sempre la stessa foto. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/**
 * Immagine di ripiego per un contenuto senza foto: quella della sua scuola se ne ha una,
 * altrimenti una foto delle sedi scelta in modo stabile dallo slug.
 */
export function immagineDiRepertorio(slug: string, scuole: string[] = []): StaticImageData {
  for (const s of scuole) if (IMMAGINI_SCUOLE[s]) return IMMAGINI_SCUOLE[s]
  return REPERTORIO[hash(slug) % REPERTORIO.length]
}
