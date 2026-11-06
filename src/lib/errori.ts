import { APIError } from 'payload'

/**
 * Errore con un messaggio da mostrare all'utente. Serve `data` non vuoto: nella build di
 * produzione i nomi delle classi sono minificati e Payload, senza `data`, risponde solo
 * “An unknown error occurred.” (vedi formatErrors di Payload).
 */
export const erroreUtente = (messaggio: string, status = 400) =>
  new APIError(messaggio, status, { messaggio }, true)
