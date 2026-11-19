import type { Access, FieldAccess } from 'payload'

import { vedeSezione } from './pannello'

type MaybeUser = Parameters<typeof vedeSezione>[0]

/** Chi gestisce lo sportello: segreteria didattica e amministratori. */
export const gestisceSportello = (user: MaybeUser) => vedeSezione(user, 'prenotazioni-segreteria')

export const soloSportello: Access = ({ req }) => gestisceSportello(req.user)

/** Segreteria: tutte; chiunque altro con l'accesso: solo le proprie (La mia area). */
export const leggiPrenotazioni: Access = ({ req }) => {
  if (!req.user) return false
  if (gestisceSportello(req.user)) return true
  return { utente: { equals: req.user.id } }
}

/** Campi interni (codice di disdetta, posto): nessuno li legge dalle API. */
export const nessuno: FieldAccess = () => false
