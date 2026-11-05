/**
 * Permessi sui calendari (orario lezioni, esami, presentazioni): li compilano segreteria
 * didattica e vicedirezione, oltre agli admin (decisione di Fede, 2026-11-05).
 */
import type { Access } from 'payload'

import { hasRole } from './roles'

type MaybeUser = Parameters<typeof hasRole>[0]

export const gestisceCalendari = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione', 'segreteria')

export const soloCalendari: Access = ({ req }) => gestisceCalendari(req.user)
