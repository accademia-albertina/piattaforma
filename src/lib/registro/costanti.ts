export const SLUG_REGISTRO = 'registro-attivita'

export const AZIONI_REGISTRO = [
  'creato',
  'modificato',
  'pubblicato',
  'ritirato',
  'eliminato',
  // Operazioni del pannello che non sono il salvataggio di un elemento
  'avviato',
  'concluso',
  'fermato',
  'collegato',
  'scollegato',
] as const
export type AzioneRegistro = (typeof AZIONI_REGISTRO)[number]

export const ETICHETTE_AZIONE: Record<AzioneRegistro, string> = {
  creato: 'Creato',
  modificato: 'Modificato',
  pubblicato: 'Pubblicato',
  ritirato: 'Tolto dalla pubblicazione',
  eliminato: 'Eliminato',
  avviato: 'Avviato',
  concluso: 'Concluso',
  fermato: 'Fermato',
  collegato: 'Collegato',
  scollegato: 'Scollegato',
}

/** Azioni che riguardano un'operazione (sincronizzazioni, Drive), non un singolo elemento. */
export const AZIONI_OPERAZIONE: readonly AzioneRegistro[] = [
  'avviato',
  'concluso',
  'fermato',
  'collegato',
  'scollegato',
]

/**
 * "Collezioni" delle operazioni: non sono collezioni Payload, servono a filtrare il registro
 * e ad aprire la pagina giusta dalla voce.
 */
export const OPERAZIONI = {
  fileWp: { slug: 'sincronizzazione-file-wp', sezione: 'File da WordPress' },
  contenutiWp: { slug: 'sincronizzazione-contenuti-wp', sezione: 'Contenuti da WordPress' },
  drive: { slug: 'google-drive', sezione: 'Google Drive' },
} as const

/** Nome mostrato quando l'operazione la fa il server da solo (avvio, attività pianificate). */
export const NOME_SISTEMA = 'Sistema'

/** Quanto restano le voci: un anno basta per ricostruire chi ha fatto cosa. */
export const GIORNI_CONSERVAZIONE = 365

/** Passa `context: { senzaRegistro: true }` per non registrare operazioni massive (import, pulizie). */
export const SENZA_REGISTRO = 'senzaRegistro'
