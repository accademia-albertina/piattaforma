import type { Access, CollectionConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { slugField } from '@/fields/slug'

const redazione: Access = ({ req }) => hasRole(req.user, 'admin', 'vicedirezione', 'redazione')

export const Scuole: CollectionConfig = {
  slug: 'scuole',
  labels: { singular: 'Scuola', plural: 'Scuole' },
  typescript: { interface: 'Scuola' },
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'sigla'],
    group: 'Didattica',
  },
  defaultSort: 'nome',
  access: {
    read: () => true,
    create: redazione,
    update: redazione,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  fields: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    {
      name: 'sigla',
      label: 'Sigla',
      type: 'text',
      admin: { description: 'Forma breve usata nei filtri, es. PAI, NTA.' },
    },
    { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
    slugField('nome'),
  ],
}
