/**
 * Categorie degli avvisi e chi può pubblicarle.
 * Tabella confermata da Fede nel debrief ("Avvisi per categoria").
 */

import { hasRole, isAdmin, type Role } from './roles'

export const CATEGORIE_AVVISI = [
  'in-evidenza',
  'generali',
  'lezioni',
  'esami',
  'eventi',
  'bandi-e-concorsi',
  'iscrizioni',
  'coordinatori',
  'tasse',
  'biblioteca',
] as const

export type CategoriaAvviso = (typeof CATEGORIE_AVVISI)[number]

export const CATEGORIA_LABELS: Record<CategoriaAvviso, string> = {
  'in-evidenza': 'In evidenza',
  generali: 'Generali',
  lezioni: 'Lezioni',
  esami: 'Esami',
  eventi: 'Eventi',
  'bandi-e-concorsi': 'Bandi e concorsi',
  iscrizioni: 'Iscrizioni A.A.',
  coordinatori: 'Coordinatori',
  tasse: 'Tasse',
  biblioteca: 'Biblioteca',
}

/** Categorie che ogni ruolo può usare. L'admin le ha tutte. */
export const CATEGORIE_PER_RUOLO: Partial<Record<Role, CategoriaAvviso[]>> = {
  vicedirezione: ['in-evidenza', 'generali', 'lezioni', 'esami', 'coordinatori'],
  redazione: ['in-evidenza', 'generali', 'eventi', 'biblioteca'],
  segreteria: ['lezioni', 'esami', 'tasse', 'iscrizioni'],
  amministrativo: ['tasse', 'bandi-e-concorsi'],
  erasmus: ['bandi-e-concorsi'],
  // Orari, chiusure e novità della biblioteca
  biblioteca: ['biblioteca'],
  // Più avanti: solo per i corsi di cui il docente è titolare.
  docente: ['lezioni', 'esami'],
}

type MaybeUser = Parameters<typeof hasRole>[0]

export function categorieConsentite(user: MaybeUser): CategoriaAvviso[] {
  if (!user) return []
  if (isAdmin(user)) return [...CATEGORIE_AVVISI]
  const consentite = new Set<CategoriaAvviso>()
  for (const role of user.roles ?? []) {
    for (const c of CATEGORIE_PER_RUOLO[role as Role] ?? []) consentite.add(c)
  }
  return CATEGORIE_AVVISI.filter((c) => consentite.has(c))
}

export function categorieNonConsentite(user: MaybeUser): CategoriaAvviso[] {
  const ok = new Set(categorieConsentite(user))
  return CATEGORIE_AVVISI.filter((c) => !ok.has(c))
}

export const puoScrivereAvvisi = (user: MaybeUser) => categorieConsentite(user).length > 0

export function isCategoria(value: string): value is CategoriaAvviso {
  return (CATEGORIE_AVVISI as readonly string[]).includes(value)
}
