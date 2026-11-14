/**
 * Sincronizzazione dei contenuti da WordPress da riga di comando (prove in locale):
 *   pnpm payload run scripts/wp/sincronizza-contenuti.ts [limite]
 * Sul sito si avvia da /admin/drive, sezione "Contenuti dal sito WordPress".
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import {
  attendiSincronizzazioneContenuti,
  avviaSincronizzazioneContenuti,
  statoContenuti,
} from '@/lib/wp-import/contenuti/sincronizza-contenuti'

const limite = Number(process.argv.at(-1)) || undefined
const payload = await getPayload({ config })
avviaSincronizzazioneContenuti(payload, { limite })
await attendiSincronizzazioneContenuti()
console.log(JSON.stringify(statoContenuti(), null, 1))
process.exit(0)
