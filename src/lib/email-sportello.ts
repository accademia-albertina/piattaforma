import type { PayloadRequest } from 'payload'

import { spedisci, type Messaggio } from '@/lib/email'
import type { PrenotazioneSegreteria } from '@/payload-types'

import { linkDisdetta, sito, VALIDITA_CODICE_MINUTI } from './sportello'
import { etichettaAppuntamento } from './sportello-orari'

const OCCHIELLO = 'Segreteria didattica'
const LUOGO = 'Segreteria didattica, Via Accademia Albertina 6, Torino'

type Dati = Pick<PrenotazioneSegreteria, 'id' | 'email' | 'nome' | 'documento' | 'inizio'>

const saluto = (nome?: string | null) => (nome?.trim() ? `Gentile ${nome.trim()},` : 'Buongiorno,')

const dettagli = (p: Dati) => [
  { etichetta: 'Documento', valore: p.documento },
  { etichetta: 'Quando', valore: etichettaAppuntamento(p.inizio) },
  { etichetta: 'Dove', valore: LUOGO },
]

export function messaggioConferma(p: Dati, codiceDisdetta?: string): Messaggio | null {
  if (!p.email) return null
  return {
    to: p.email,
    subject: `Appuntamento in segreteria: ${etichettaAppuntamento(p.inizio)}`,
    contenuto: {
      occhiello: OCCHIELLO,
      titolo: 'Appuntamento confermato',
      saluto: saluto(p.nome),
      paragrafi: [
        `il tuo appuntamento per il ritiro di “${p.documento}” è confermato.`,
        'Presentati puntuale con un documento d’identità.',
      ],
      dettagli: dettagli(p),
      pulsante: codiceDisdetta
        ? { testo: 'Disdici l’appuntamento', url: linkDisdetta(p, codiceDisdetta) }
        : undefined,
      note: [
        'Se non puoi venire, disdici: il turno torna libero per un altro studente.',
      ],
    },
  }
}

export type MotivoAnnullamento =
  | { da: 'utente' }
  | { da: 'segreteria'; motivo?: string | null }
  | { da: 'chiusura'; motivo?: string | null }

export function messaggioAnnullamento(p: Dati, m: MotivoAnnullamento): Messaggio | null {
  if (!p.email) return null
  const paragrafi =
    m.da === 'utente'
      ? [`il tuo appuntamento per il ritiro di “${p.documento}” è stato disdetto.`]
      : [
          `la segreteria ha annullato il tuo appuntamento per il ritiro di “${p.documento}”${
            m.da === 'chiusura' ? ' per una chiusura dello sportello' : ''
          }.`,
          ...(m.motivo?.trim() ? [`Motivo: ${m.motivo.trim()}`] : []),
          'Ci scusiamo per il disagio: puoi prenotare un nuovo turno dal sito.',
        ]
  return {
    to: p.email,
    subject: `Appuntamento annullato: ${etichettaAppuntamento(p.inizio)}`,
    contenuto: {
      occhiello: OCCHIELLO,
      titolo: m.da === 'utente' ? 'Appuntamento disdetto' : 'Appuntamento annullato',
      saluto: saluto(p.nome),
      paragrafi,
      dettagli: dettagli(p).slice(0, 2),
      pulsante: { testo: 'Prenota un nuovo turno', url: `${sito()}/prenotazioni-segreteria` },
    },
  }
}

export function messaggioCodice(email: string, codice: string): Messaggio {
  return {
    to: email,
    subject: `${codice} è il tuo codice per prenotare in segreteria`,
    contenuto: {
      occhiello: OCCHIELLO,
      titolo: 'Codice di conferma',
      saluto: 'Buongiorno,',
      paragrafi: [
        'per confermare la prenotazione in segreteria didattica scrivi questo codice nella pagina del sito:',
      ],
      dettagli: [{ etichetta: 'Codice', valore: codice }],
      note: [
        `Il codice vale ${VALIDITA_CODICE_MINUTI} minuti. Se non hai chiesto tu di prenotare, ignora questa email.`,
      ],
    },
  }
}

export const avvisaConferma = (req: PayloadRequest, p: Dati, codice?: string) =>
  spedisci(req, messaggioConferma(p, codice))

export const avvisaAnnullamento = (req: PayloadRequest, p: Dati, m: MotivoAnnullamento) =>
  spedisci(req, messaggioAnnullamento(p, m))
