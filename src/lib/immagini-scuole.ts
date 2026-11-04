import type { StaticImageData } from 'next/image'

import cinema from '@/assets/scuole/cinema-fotografia-e-audiovisivo.webp'
import comunicazione from '@/assets/scuole/comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo.webp'
import decorazione from '@/assets/scuole/decorazione.webp'
import didattica from '@/assets/scuole/didattica-dellarte.webp'
import grafica from '@/assets/scuole/grafica-darte.webp'
import nta from '@/assets/scuole/nuove-tecnologie-dellarte.webp'
import pittura from '@/assets/scuole/pittura.webp'
import pai from '@/assets/scuole/progettazione-artistica-per-limpresa.webp'
import scenografia from '@/assets/scuole/scenografia.webp'
import scultura from '@/assets/scuole/scultura.webp'

/** Immagini di repertorio delle scuole (scelte da Fede), per slug della scuola. */
export const IMMAGINI_SCUOLE: Record<string, StaticImageData> = {
  'cinema-fotografia-e-audiovisivo': cinema,
  'comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo': comunicazione,
  decorazione,
  'didattica-dellarte': didattica,
  'grafica-darte': grafica,
  'nuove-tecnologie-dellarte': nta,
  pittura,
  'progettazione-artistica-per-limpresa': pai,
  scenografia,
  scultura,
}
