/**
 * Iscrizioni ai corsi (e, in seguito, agli esami). Decisioni di Fede del 2026-11-06:
 * - segreteria, vicedirezione e admin aprono una finestra per periodo (semestre per i corsi,
 *   sessione per gli esami);
 * - il docente può solo prolungare la chiusura sul proprio corso;
 * - dopo la chiusura lo studente non si iscrive né annulla, il docente vede sempre gli iscritti;
 * - niente posti limitati.
 */
import type { Access, Where } from 'payload'

import { classifyEmail, hasRole } from './roles'

type MaybeUser = Parameters<typeof hasRole>[0]

/** Chi apre le finestre e gestisce tutte le iscrizioni. */
export const gestisceIscrizioni = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione', 'segreteria')

export const soloGestioneIscrizioni: Access = ({ req }) => gestisceIscrizioni(req.user)

export const TIPI_FINESTRA = ['corsi', 'esami'] as const
export type TipoFinestra = (typeof TIPI_FINESTRA)[number]
export const TIPO_FINESTRA_LABELS: Record<TipoFinestra, string> = {
  corsi: 'Iscrizioni ai corsi',
  esami: 'Iscrizioni agli esami',
}

/** Periodi delle finestre: semestri per i corsi, sessioni per gli esami. */
export const PERIODI_CORSI = [
  { value: 'primo', label: 'Primo semestre' },
  { value: 'secondo', label: 'Secondo semestre' },
] as const
export const SESSIONI_ESAMI = [
  { value: 'invernale', label: 'Sessione invernale (febbraio)' },
  { value: 'estiva', label: 'Sessione estiva (giugno)' },
  { value: 'autunnale', label: 'Sessione autunnale (settembre)' },
] as const
export const PERIODI = [...PERIODI_CORSI, ...SESSIONI_ESAMI]
export const etichettaPeriodo = (v: string | null | undefined) =>
  PERIODI.find((p) => p.value === v)?.label ?? ''

export type StatoFinestra = 'nessuna' | 'prima' | 'aperta' | 'chiusa'

export type Finestra = { apertura: string; chiusura: string }

/**
 * Stato di una finestra in un dato momento. La proroga del docente sposta solo la chiusura
 * e conta solo se è più tarda di quella fissata dagli uffici.
 */
export function statoFinestra(
  finestra: Finestra | null | undefined,
  proroga?: string | null,
  ora = new Date(),
): { stato: StatoFinestra; apertura?: Date; chiusura?: Date } {
  if (!finestra) return { stato: 'nessuna' }
  const apertura = new Date(finestra.apertura)
  let chiusura = new Date(finestra.chiusura)
  if (proroga) {
    const p = new Date(proroga)
    if (p > chiusura) chiusura = p
  }
  const stato = ora < apertura ? 'prima' : ora > chiusura ? 'chiusa' : 'aperta'
  return { stato, apertura, chiusura }
}

/** Livello dello studente ricavato dall'email (12345t@ triennio, 12345b@ biennio). */
export function datiStudente(email: string | null | undefined) {
  const p = email ? classifyEmail(email) : null
  if (p?.kind !== 'studente') return null
  return { livello: p.corso, matricola: p.matricola }
}

/** Studente: solo le proprie; docente: quelle dei suoi corsi; uffici: tutte. */
export const leggiIscrizioni: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (gestisceIscrizioni(user)) return true
  const condizioni: Where[] = []
  if (hasRole(user, 'studente')) condizioni.push({ studente: { equals: user.id } })
  if (hasRole(user, 'docente')) condizioni.push({ 'corso.docenti.account': { equals: user.id } })
  if (!condizioni.length) return false
  return condizioni.length === 1 ? condizioni[0] : { or: condizioni }
}

/** Si iscrive lo studente (i controlli sulla finestra sono nell'hook); gli uffici possono aggiungere. */
export const creaIscrizione: Access = ({ req }) =>
  gestisceIscrizioni(req.user) || hasRole(req.user, 'studente')

/** Lo studente annulla solo le proprie (finché la finestra è aperta, vedi hook). */
export const annullaIscrizione: Access = ({ req }) => {
  if (!req.user) return false
  if (gestisceIscrizioni(req.user)) return true
  if (!hasRole(req.user, 'studente')) return false
  return { studente: { equals: req.user.id } } satisfies Where
}

/** Docente o co-docente del corso dell'appello. */
const docenteDelCorso = (userId: number | string): Where => ({
  'corso.docenti.account': { equals: userId },
})

/** Appelli: uffici tutti; il docente quelli dei propri corsi (anche per aggiungere turni). */
export const modificaAppello: Access = ({ req }) => {
  if (!req.user) return false
  if (gestisceIscrizioni(req.user)) return true
  if (!hasRole(req.user, 'docente')) return false
  return docenteDelCorso(req.user.id)
}

export const creaAppello: Access = ({ req }) =>
  gestisceIscrizioni(req.user) || hasRole(req.user, 'docente')

/** Iscrizioni agli esami: studente le proprie, docente quelle dei suoi appelli, uffici tutte. */
export const leggiIscrizioniEsami: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (gestisceIscrizioni(user)) return true
  const condizioni: Where[] = []
  if (hasRole(user, 'studente')) condizioni.push({ studente: { equals: user.id } })
  if (hasRole(user, 'docente'))
    condizioni.push({ 'appello.corso.docenti.account': { equals: user.id } })
  if (!condizioni.length) return false
  return condizioni.length === 1 ? condizioni[0] : { or: condizioni }
}
