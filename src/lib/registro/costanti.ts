export const SLUG_REGISTRO = 'registro-attivita'

export const AZIONI_REGISTRO = [
  'creato',
  'modificato',
  'pubblicato',
  'ritirato',
  'eliminato',
] as const
export type AzioneRegistro = (typeof AZIONI_REGISTRO)[number]

export const ETICHETTE_AZIONE: Record<AzioneRegistro, string> = {
  creato: 'Creato',
  modificato: 'Modificato',
  pubblicato: 'Pubblicato',
  ritirato: 'Tolto dalla pubblicazione',
  eliminato: 'Eliminato',
}

/** Quanto restano le voci: un anno basta per ricostruire chi ha fatto cosa. */
export const GIORNI_CONSERVAZIONE = 365

/** Passa `context: { senzaRegistro: true }` per non registrare operazioni massive (import, pulizie). */
export const SENZA_REGISTRO = 'senzaRegistro'
