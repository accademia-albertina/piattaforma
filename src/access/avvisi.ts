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
  'ammissioni',
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
  ammissioni: 'Ammissioni',
}

/**
 * Avvisi dei coordinatori di scuola sugli esami di ammissione. Compaiono nella pagina
 * Ammissioni (blocco "Avvisi di ammissione", sotto la loro scuola) e nell'archivio /avvisi,
 * ma non in home né nella pagina della scuola (Fede, 18/11/2026). La categoria è esclusiva e
 * l'avviso ha sempre almeno una scuola.
 */
export const CATEGORIA_AMMISSIONI = 'ammissioni' satisfies CategoriaAvviso

/** Categorie che restano fuori da home e pagine delle scuole (in /avvisi ci sono). */
export const CATEGORIE_SOLO_ARCHIVIO: CategoriaAvviso[] = [CATEGORIA_AMMISSIONI]

/** Categorie che ogni ruolo può usare. L'admin le ha tutte. */
export const CATEGORIE_PER_RUOLO: Partial<Record<Role, CategoriaAvviso[]>> = {
  vicedirezione: ['in-evidenza', 'generali', 'lezioni', 'esami', 'coordinatori', 'ammissioni'],
  redazione: ['in-evidenza', 'generali', 'eventi', 'biblioteca'],
  segreteria: ['lezioni', 'esami', 'tasse', 'iscrizioni'],
  amministrativo: ['tasse', 'bandi-e-concorsi'],
  erasmus: ['bandi-e-concorsi'],
  // Orari, chiusure e novità della biblioteca
  biblioteca: ['biblioteca'],
  // Più avanti: solo per i corsi di cui il docente è titolare.
  docente: ['lezioni', 'esami'],
}

type MaybeUser =
  | (NonNullable<Parameters<typeof hasRole>[0]> & { scuoleCoordinate?: number[] | null })
  | null
  | undefined

/**
 * Scuole di cui l'utente è coordinatore (Scuole → Persone → Coordinatore scuola, collegato
 * al suo account dal profilo docente). Calcolate a ogni accesso: vedi il campo virtuale
 * `scuoleCoordinate` degli utenti.
 */
export function scuoleCoordinate(user: MaybeUser): number[] {
  if (!user || !hasRole(user, 'docente')) return []
  return user.scuoleCoordinate ?? []
}

export const eCoordinatoreScuola = (user: MaybeUser) => scuoleCoordinate(user).length > 0

/** Admin e vicedirezione scrivono gli avvisi di ammissione per qualsiasi scuola. */
export const gestisceTutteLeAmmissioni = (user: MaybeUser) =>
  hasRole(user, 'admin', 'vicedirezione')

export function categorieConsentite(user: MaybeUser): CategoriaAvviso[] {
  if (!user) return []
  if (isAdmin(user)) return [...CATEGORIE_AVVISI]
  const consentite = new Set<CategoriaAvviso>()
  for (const role of user.roles ?? []) {
    for (const c of CATEGORIE_PER_RUOLO[role as Role] ?? []) consentite.add(c)
  }
  // Gli avvisi di ammissione li scrive il coordinatore della scuola, non ogni docente
  if (eCoordinatoreScuola(user)) consentite.add(CATEGORIA_AMMISSIONI)
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
