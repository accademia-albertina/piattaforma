/**
 * Albo online e Amministrazione trasparente: li aggiornano gli uffici dal pannello.
 * Albo: ufficio amministrativo e vicedirezione (tabella ruoli di Fede, 2026-11-06).
 * Trasparenza: ufficio amministrativo e vicedirezione. Gli admin sempre.
 */
import type { Access } from 'payload'

import { hasRole } from './roles'

type MaybeUser = Parameters<typeof hasRole>[0]

export const gestisceAlbo = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione', 'amministrativo')

export const gestisceTrasparenza = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione', 'amministrativo')

export const soloAlbo: Access = ({ req }) => gestisceAlbo(req.user)
export const soloTrasparenza: Access = ({ req }) => gestisceTrasparenza(req.user)
