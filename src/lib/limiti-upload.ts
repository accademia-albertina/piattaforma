import { APIError, type CollectionBeforeOperationHook } from 'payload'

import { isAdmin } from '@/access/roles'

const MB = 1024 * 1024

/**
 * Dimensione massima di un file caricato da chi non è admin. Le foto valgono di più perché il sito
 * le riduce comunque (WebP Full HD); i PDF restano come sono e pesano su chi li scarica.
 */
export const LIMITE_MB = { immagine: 20, pdf: 10 } as const

/** Tetto per tutti, admin compresi (il server tiene il file in memoria durante il caricamento). */
export const LIMITE_ASSOLUTO_MB = 50
export const LIMITE_ASSOLUTO_BYTE = LIMITE_ASSOLUTO_MB * MB

const mb = (byte: number) => (byte / MB).toLocaleString('it-IT', { maximumFractionDigits: 1 })

/** Messaggio se il file supera il limite per l'utente, altrimenti null. */
export function erroreDimensione(
  file: { size?: number; mimetype?: string } | undefined,
  user: Parameters<typeof isAdmin>[0],
): string | null {
  if (!file?.size || isAdmin(user)) return null
  const pdf = file.mimetype === 'application/pdf'
  const limite = pdf ? LIMITE_MB.pdf : LIMITE_MB.immagine
  if (file.size <= limite * MB) return null
  return pdf
    ? `Il PDF pesa ${mb(file.size)} MB: il massimo è ${limite} MB. Salvalo di nuovo con una qualità più bassa (o dividilo in più file) e riprova.`
    : `L’immagine pesa ${mb(file.size)} MB: il massimo è ${limite} MB. Riducila e riprova.`
}

/** Hook di Media: blocca i file troppo grandi per chi non è admin (la UI mostra il messaggio). */
export const controllaDimensione: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  // Import e script del server (Local API senza utente) non hanno limiti
  if (!req.user) return args
  const errore = erroreDimensione(req.file, req.user)
  if (errore) throw new APIError(errore, 413, undefined, true)
  return args
}
