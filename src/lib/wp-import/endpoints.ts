/**
 * Endpoint della sincronizzazione dei file da WordPress (solo amministratori):
 *   POST /api/wp-import/avvia  → avvia (campo "limite" facoltativo: prova con pochi file)
 *   POST /api/wp-import/ferma  → si ferma dopo il file in corso
 *   POST /api/wp-import/contenuti/avvia, /contenuti/ferma → lo stesso per Albo, Trasparenza, avvisi
 * Tornano a /admin/drive con ?esito= (messaggi nella pagina).
 */
import type { Endpoint, PayloadRequest } from 'payload'

import { isAdmin } from '@/access/roles'

import {
  avviaSincronizzazioneContenuti,
  fermaSincronizzazioneContenuti,
} from './contenuti/sincronizza-contenuti'
import { avviaSincronizzazione, fermaSincronizzazione } from './sincronizza'

const PAGINA = '/admin/drive'

function torna(req: PayloadRequest, esito: string, ancora = 'wordpress') {
  const origine =
    process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url ?? 'http://localhost').origin
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${origine}${PAGINA}?esito=${esito}#${ancora}`,
      'Cache-Control': 'no-store',
    },
  })
}

function soloAdmin(req: PayloadRequest) {
  if (!req.user)
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/login?redirect=${PAGINA}` },
    })
  if (!isAdmin(req.user)) return new Response('Riservato agli amministratori', { status: 403 })
  return null
}

async function limite(req: PayloadRequest) {
  try {
    const form = await req.formData?.()
    const n = Number(form?.get('limite'))
    return Number.isInteger(n) && n > 0 ? Math.min(n, 10_000) : undefined
  } catch {
    return undefined
  }
}

export const endpointsWp: Endpoint[] = [
  {
    path: '/wp-import/avvia',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      const avviata = avviaSincronizzazione(req.payload, { limite: await limite(req) })
      req.payload.logger.info(`Importazione da WordPress avviata da ${req.user!.email}`)
      return torna(req, avviata ? 'wp-avviata' : 'wp-gia-in-corso')
    },
  },
  {
    path: '/wp-import/ferma',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      fermaSincronizzazione()
      return torna(req, 'wp-fermata')
    },
  },
  {
    path: '/wp-import/contenuti/avvia',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      const avviata = avviaSincronizzazioneContenuti(req.payload, { limite: await limite(req) })
      req.payload.logger.info(
        `Sincronizzazione contenuti da WordPress avviata da ${req.user!.email}`,
      )
      return torna(req, avviata ? 'wpc-avviata' : 'wpc-gia-in-corso', 'contenuti-wordpress')
    },
  },
  {
    path: '/wp-import/contenuti/ferma',
    method: 'post',
    handler: async (req) => {
      const blocco = soloAdmin(req)
      if (blocco) return blocco
      fermaSincronizzazioneContenuti()
      return torna(req, 'wpc-fermata', 'contenuti-wordpress')
    },
  },
]
