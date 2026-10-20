/**
 * Ruoli della piattaforma e regole di accesso derivate dall'email istituzionale.
 * Vedi debrief, sezione "Ruoli e accesso".
 */

export const ROLES = [
  'admin',
  'vicedirezione',
  'redazione',
  'segreteria',
  'amministrativo',
  'erasmus',
  'docente',
  'dottorando',
  'studente',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Amministratore',
  vicedirezione: 'Vicedirezione',
  redazione: 'Redazione / Comunicazione',
  segreteria: 'Segreteria didattica',
  amministrativo: 'Ufficio amministrativo',
  erasmus: 'Ufficio Erasmus',
  docente: 'Docente',
  dottorando: 'Dottorando',
  studente: 'Studente',
}

export const ALLOWED_DOMAIN = 'albertina.academy'

/** Anni di validità dell'account studente per tipo di corso. */
export const STUDENT_ACCESS_YEARS = { triennio: 4, biennio: 3 } as const

export type EmailProfile =
  | { kind: 'studente'; corso: keyof typeof STUDENT_ACCESS_YEARS; matricola: string }
  | { kind: 'personale' }

const STUDENT_PATTERN = /^(\d+)([tb])$/
const STAFF_PATTERN = /^[a-z]+(?:[.-][a-z]+)+$/

/**
 * Classifica un'email del dominio istituzionale.
 * - 12345t@ → studente triennio, 12345b@ → studente biennio
 * - nome.cognome@ → personale (docenti, dottorandi, uffici): nessun ruolo finché un admin non lo assegna
 * Restituisce null per email fuori dominio o non riconosciute.
 */
export function classifyEmail(email: string): EmailProfile | null {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at < 1) return null
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  if (domain !== ALLOWED_DOMAIN) return null

  const student = STUDENT_PATTERN.exec(local)
  if (student) {
    return {
      kind: 'studente',
      corso: student[2] === 't' ? 'triennio' : 'biennio',
      matricola: student[1],
    }
  }
  if (STAFF_PATTERN.test(local)) return { kind: 'personale' }
  return null
}

/** Ruoli assegnati automaticamente al primo accesso. */
export function defaultRolesForEmail(email: string): Role[] {
  return classifyEmail(email)?.kind === 'studente' ? ['studente'] : []
}

/** Data di scadenza dell'account studente a partire dalla data di immatricolazione. */
export function studentAccessExpiry(profile: EmailProfile, from: Date): Date | null {
  if (profile.kind !== 'studente') return null
  const expiry = new Date(from)
  expiry.setFullYear(expiry.getFullYear() + STUDENT_ACCESS_YEARS[profile.corso])
  return expiry
}

type MaybeUser = { roles?: (Role | string)[] | null } | null | undefined

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  if (!user?.roles) return false
  return user.roles.some((r) => (roles as string[]).includes(r))
}

export const isAdmin = (user: MaybeUser) => hasRole(user, 'admin')

/** Ruoli che possono entrare nel pannello di amministrazione. */
export const BACKEND_ROLES: Role[] = [
  'admin',
  'vicedirezione',
  'redazione',
  'segreteria',
  'amministrativo',
  'erasmus',
  'docente',
]

export const canAccessBackend = (user: MaybeUser) => hasRole(user, ...BACKEND_ROLES)
