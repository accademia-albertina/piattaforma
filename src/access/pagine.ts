import type { Access, Where } from 'payload'

import { canAccessBackend, hasRole, isAdmin, type Role } from './roles'

/** Ruoli che gestiscono tutte le pagine istituzionali. */
export const REDATTORI_PAGINE: Role[] = ['admin', 'vicedirezione', 'redazione']

/** Uffici a cui si può affidare una singola pagina (es. Iscrizioni alla segreteria). */
export const UFFICI_PAGINE = ['segreteria', 'amministrativo', 'erasmus', 'biblioteca'] as const satisfies Role[]

type MaybeUser = Parameters<typeof hasRole>[0]

export const isRedattorePagine = (user: MaybeUser) => hasRole(user, ...REDATTORI_PAGINE)

/** Il pubblico vede solo le pagine pubblicate; chi lavora nel pannello anche le bozze. */
export const leggiPagine: Access = ({ req }) => {
  if (canAccessBackend(req.user)) return true
  return { _status: { equals: 'published' } } satisfies Where
}

/** Redazione e vicedirezione modificano tutto; un ufficio solo le pagine che gli sono affidate. */
export const modificaPagine: Access = ({ req }) => {
  if (!req.user) return false
  if (isRedattorePagine(req.user)) return true
  const uffici = UFFICI_PAGINE.filter((u) => hasRole(req.user, u))
  if (uffici.length === 0) return false
  return { ufficiEditori: { in: uffici } } satisfies Where
}

export const creaPagine: Access = ({ req }) => isRedattorePagine(req.user)

/** Eliminare una pagina rompe link e menu: solo admin. */
export const eliminaPagine: Access = ({ req }) => isAdmin(req.user)
