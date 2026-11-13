import type { Payload } from 'payload'

/** Giorni di conservazione del registro delle email: poi le righe si cancellano da sole. */
export const GIORNI_REGISTRO_EMAIL = 30

export type EsitoEmail = 'inviata' | 'errore' | 'non-spedita'

export type VoceRegistro = {
  destinatario: string
  consegnataA?: string
  oggetto: string
  testo?: string
  esito: EsitoEmail
  errore?: string
  idMessaggio?: string
  risposta?: string
}

let ultimaPulizia = 0

/** Cancella le voci più vecchie di 30 giorni. */
export async function puliziaRegistroEmail(payload: Payload, adesso = new Date()) {
  const limite = new Date(adesso.getTime() - GIORNI_REGISTRO_EMAIL * 24 * 60 * 60 * 1000)
  const { docs } = await payload.delete({
    collection: 'email-inviate',
    where: { createdAt: { less_than: limite.toISOString() } },
    depth: 0,
    overrideAccess: true,
  })
  ultimaPulizia = adesso.getTime()
  return docs.length
}

/**
 * Scrive una voce nel registro “Email inviate”. Non lancia mai: un problema del registro non
 * deve impedire l'invio. Al massimo una volta l'ora toglie anche le voci scadute.
 */
export async function registraEmail(payload: Payload, voce: VoceRegistro) {
  try {
    await payload.create({
      collection: 'email-inviate',
      data: voce,
      depth: 0,
      overrideAccess: true,
    })
    if (Date.now() - ultimaPulizia > 60 * 60 * 1000) await puliziaRegistroEmail(payload)
  } catch (err) {
    payload.logger.error({ err, msg: 'Registro email non aggiornato' })
  }
}
