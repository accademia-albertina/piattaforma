import { nascostaA } from '@/access/pannello'
import { APIError, type Access, type CollectionConfig, type FieldAccess } from 'payload'

import { endpointsGoogle } from '@/auth/endpoints'
import { ssoAttivo } from '@/auth/google'
import {
  ROLES,
  ROLE_LABELS,
  canAccessBackend,
  defaultRolesForEmail,
  hasRole,
  isAdmin,
  puoUsareLaPassword,
} from '@/access/roles'
import { assicuraProfiloDocente } from '@/lib/profilo-docente'
import type { User } from '@/payload-types'

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
    // Con Google configurato, la password vale solo per gli admin (accesso di emergenza) e per
    // gli account di prova. L'accesso con Google non passa da qui: apre la sessione direttamente
    // (src/auth/sessione.ts).
    beforeLogin: [
      ({ user }) => {
        if (ssoAttivo() && !puoUsareLaPassword(user)) {
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
    // Ruolo Docente assegnato (o account creato già docente): profilo pubblico garantito
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        const era = (previousDoc as User | undefined)?.roles?.includes('docente')
        // Solo quando il ruolo lo assegna una persona (pannello o API): import e script restano fuori
        if (req.user && doc.roles?.includes('docente') && !era) {
          await assicuraProfiloDocente(req.payload, doc as User, req)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      // Occhio sulla password; con Google attivo il pulsante «Cambia password» resta solo
      // dove la password serve davvero (admin e account di prova)
      name: 'gestionePassword',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '/components/admin/GestionePassword',
            clientProps: { soloGoogle: ssoAttivo() },
          },
        },
      },
    },
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
    {
      name: 'accountDiProva',
      label: 'Account di prova',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: adminOnlyField,
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        position: 'sidebar',
        description:
          'Entra con email e password invece che con Google, per vedere il sito come uno studente o un docente. Solo per account finti.',
      },
    },
    {
      // Non salvato: si ricalcola a ogni accesso, così se la vicedirezione cambia il
      // coordinatore di una scuola il permesso sugli avvisi di ammissione passa da solo.
      name: 'scuoleCoordinate',
      type: 'number',
      hasMany: true,
      virtual: true,
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id || !hasRole(data as { roles?: string[] }, 'docente')) return []
            // Solo per chi sta entrando (req.user non c'è ancora) o legge sé stesso:
            // gli elenchi degli utenti non pagano una query per riga.
            if (req.user && req.user.id !== data.id) return []
            const { docs } = await req.payload.find({
              collection: 'scuole',
              where: { 'coordinatoreScuola.account': { equals: data.id } },
              depth: 0,
              limit: 20,
              pagination: false,
              overrideAccess: true,
              select: {},
            })
            return docs.map((d) => d.id)
          },
        ],
      },
    },
  ],
}
