/**
 * Permessi su Corsi e Docenti.
 * Creare corsi e assegnare i docenti spetta a vicedirezione e admin (decisione di Fede);
 * il docente aggiorna solo il programma dei propri corsi e il proprio profilo.
 */
import type { Access, FieldAccess, Where } from 'payload'

import { canAccessBackend, hasRole } from './roles'

type MaybeUser = Parameters<typeof hasRole>[0]

export const gestisceDidattica = (user: MaybeUser) => hasRole(user, 'admin', 'vicedirezione')

/** Il pubblico vede i documenti pubblicati; chi lavora nel pannello anche le bozze. */
export const leggiPubblicati: Access = ({ req }) => {
  if (canAccessBackend(req.user)) return true
  return { _status: { equals: 'published' } } satisfies Where
}

export const soloDidattica: Access = ({ req }) => gestisceDidattica(req.user)

export const campoSoloDidattica: FieldAccess = ({ req }) => gestisceDidattica(req.user)

/** Vicedirezione e admin modificano tutti i corsi; il docente solo quelli in cui è titolare. */
export const modificaCorso: Access = ({ req }) => {
  if (!req.user) return false
  if (gestisceDidattica(req.user)) return true
  if (!hasRole(req.user, 'docente')) return false
  return { 'docenti.account': { equals: req.user.id } } satisfies Where
}

/** Vicedirezione e admin modificano tutti i profili; il docente solo il proprio. */
export const modificaDocente: Access = ({ req }) => {
  if (!req.user) return false
  if (gestisceDidattica(req.user)) return true
  if (!hasRole(req.user, 'docente')) return false
  return { account: { equals: req.user.id } } satisfies Where
}

/** Anno accademico in corso: da settembre si passa al successivo (es. ottobre 2026 → 2026/2027). */
export function annoAccademicoCorrente(oggi = new Date()): string {
  const anno = oggi.getFullYear()
  const inizio = oggi.getMonth() >= 8 ? anno : anno - 1
  return `${inizio}/${inizio + 1}`
}

export function isAnnoAccademico(valore: unknown): valore is string {
  if (typeof valore !== 'string') return false
  const m = /^(\d{4})\/(\d{4})$/.exec(valore)
  return !!m && Number(m[2]) === Number(m[1]) + 1
}

export const LIVELLI = ['triennio', 'biennio'] as const
export type Livello = (typeof LIVELLI)[number]
export const LIVELLO_LABELS: Record<Livello, string> = { triennio: 'Triennio', biennio: 'Biennio' }

export const RUOLI_DOCENTE = ['tempo-indeterminato', 'tempo-determinato', 'contratto'] as const
export type RuoloDocente = (typeof RUOLI_DOCENTE)[number]
export const RUOLO_DOCENTE_LABELS: Record<RuoloDocente, string> = {
  'tempo-indeterminato': 'Docente a tempo indeterminato',
  'tempo-determinato': 'Docente a tempo determinato',
  contratto: 'Docente a contratto',
}
