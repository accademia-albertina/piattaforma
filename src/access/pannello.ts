/**
 * Cosa vede ogni ruolo nel pannello (menu laterale e dashboard).
 * Regola: si vede solo ciò che si può modificare. Tabella approvata da Fede il 2026-11-06
 * (documento "Pannello: cosa vede ogni ruolo"). L'admin vede sempre tutto.
 */
import type { Where } from 'payload'

import { UFFICI_PAGINE } from './pagine'
import { hasRole, isAdmin, type Role } from './roles'

type MaybeUser = ({ roles?: (Role | string)[] | null; id?: number | string } & object) | null | undefined

export const SEZIONI_PANNELLO = [
  'pagine',
  'avvisi',
  'pubblicazioni',
  'media',
  'corsi',
  'docenti',
  'dottorandi',
  'calendari',
  'scuole',
  'albo',
  'trasparenza',
  'users',
  'navigazione',
  'changelog',
] as const
export type SezionePannello = (typeof SEZIONI_PANNELLO)[number]

const UFFICI: Role[] = ['segreteria', 'amministrativo', 'erasmus', 'biblioteca']

/** Ruoli (oltre all'admin) che vedono ogni sezione. */
export const VISIBILITA: Record<SezionePannello, Role[]> = {
  pagine: ['vicedirezione', 'redazione', ...UFFICI],
  avvisi: ['vicedirezione', 'redazione', ...UFFICI, 'docente'],
  pubblicazioni: ['redazione', 'biblioteca'],
  media: ['vicedirezione', 'redazione', ...UFFICI, 'docente'],
  corsi: ['vicedirezione', 'docente'],
  docenti: ['vicedirezione', 'docente'],
  dottorandi: ['vicedirezione'],
  calendari: ['vicedirezione', 'segreteria'],
  scuole: ['vicedirezione'],
  albo: ['vicedirezione', 'amministrativo'],
  trasparenza: ['vicedirezione', 'amministrativo'],
  users: [],
  navigazione: [],
  changelog: ['vicedirezione', 'redazione', ...UFFICI],
}

export const vedeSezione = (user: MaybeUser, sezione: SezionePannello) =>
  isAdmin(user) || hasRole(user, ...VISIBILITA[sezione])

/** Per `admin.hidden` di collezioni e globali. */
export const nascostaA =
  (sezione: SezionePannello) =>
  ({ user }: { user: unknown }) =>
    !vedeSezione(user as MaybeUser, sezione)

/** Chi vede tutti gli elementi di una sezione, non solo i propri. */
const VEDE_TUTTO: Partial<Record<SezionePannello, Role[]>> = {
  pagine: ['vicedirezione', 'redazione'],
  avvisi: ['vicedirezione', 'redazione', ...UFFICI],
  media: ['vicedirezione', 'redazione', ...UFFICI],
  corsi: ['vicedirezione'],
  docenti: ['vicedirezione'],
}

/**
 * Filtro degli elenchi del pannello: "Suoi" per il docente, "Affidate" per gli uffici.
 * null = nessun filtro. Non cambia chi può leggere i contenuti pubblici.
 */
export function filtroPannello(user: MaybeUser, sezione: SezionePannello): Where | null {
  if (!user || isAdmin(user)) return null
  const tutti = VEDE_TUTTO[sezione]
  if (!tutti || hasRole(user, ...tutti)) return null
  switch (sezione) {
    case 'pagine': {
      const uffici = UFFICI_PAGINE.filter((u) => hasRole(user, u))
      return { ufficiEditori: { in: uffici } }
    }
    case 'avvisi':
      return { autore: { equals: user.id } }
    case 'media':
      return { creatoDa: { equals: user.id } }
    case 'corsi':
      return { 'docenti.account': { equals: user.id } }
    case 'docenti':
      return { account: { equals: user.id } }
    default:
      return null
  }
}

/** Per `admin.baseFilter`: applica il filtro nell'elenco e nei collegamenti del pannello. */
export const filtroElenco =
  (sezione: SezionePannello) =>
  ({ req }: { req: { user?: unknown } }) =>
    filtroPannello(req.user as MaybeUser, sezione)

/** Chi vede tutte le ultime modifiche in dashboard; gli altri solo le proprie. */
export const vedeTutteLeModifiche = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione', 'redazione')
