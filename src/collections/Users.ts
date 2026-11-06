import { nascostaA } from '@/access/pannello'
import { APIError, type Access, type CollectionConfig, type FieldAccess } from 'payload'

import { endpointsGoogle } from '@/auth/endpoints'
import { ssoAttivo } from '@/auth/google'
import { ROLES, ROLE_LABELS, canAccessBackend, defaultRolesForEmail, isAdmin } from '@/access/roles'

const adminOnly: Access = ({ req }) => isAdmin(req.user)

/** Admin vede tutti, gli altri solo se stessi. */
const adminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  return { id: { equals: req.user.id } }
}

const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req.user)

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utente', plural: 'Utenti' },
  admin: {
    hidden: nascostaA('users'),
    useAsTitle: 'email',
    description: 'Chi entra nel pannello e con quali ruoli.',
    defaultColumns: ['email', 'nome', 'cognome', 'roles'],
    group: 'Sistema',
  },
  // Accesso con Google Workspace (src/auth): /api/users/google. Email e password restano per
  // gli account di servizio e finché le credenziali Google non sono configurate.
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  endpoints: endpointsGoogle,
  access: {
    admin: ({ req }) => canAccessBackend(req.user),
    create: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    // Con Google configurato, la password vale solo per gli admin (accesso di emergenza).
    // L'accesso con Google non passa da qui: apre la sessione direttamente (src/auth/sessione.ts).
    beforeLogin: [
      ({ user }) => {
        if (ssoAttivo() && !isAdmin(user)) {
          throw new APIError(
            'Usa “Accedi con Google” con il tuo account @albertina.academy.',
            403,
            { motivo: 'solo-google' }, // con data il messaggio arriva al modulo di accesso
            true,
          )
        }
        return user
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        // Il primo utente creato (bootstrap) è amministratore.
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) {
          data.roles = ['admin']
        } else if (data.email && !data.roles?.length) {
          data.roles = defaultRolesForEmail(data.email)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'nome', type: 'text' },
    { name: 'cognome', type: 'text' },
    {
      name: 'roles',
      label: 'Ruoli',
      type: 'select',
      hasMany: true,
      saveToJWT: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        description: 'Solo un amministratore può assegnare o togliere ruoli.',
      },
    },
  ],
}
