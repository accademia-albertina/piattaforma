import type { Field } from 'payload'

/**
 * Chi ha creato l'elemento: serve a mostrare al docente solo i propri avvisi e file nel
 * pannello. Si compila da solo alla creazione e non si modifica.
 */
export const creatoDaField = (): Field => ({
  name: 'creatoDa',
  label: 'Creato da',
  type: 'relationship',
  relationTo: 'users',
  index: true,
  access: { update: () => false },
  admin: { readOnly: true, position: 'sidebar', condition: (_, __, { user }) => Boolean(user) },
  hooks: {
    beforeChange: [
      ({ operation, req, value }) =>
        operation === 'create' && req.user && !value ? req.user.id : value,
    ],
  },
})
