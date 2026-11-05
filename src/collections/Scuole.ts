import type { Access, CollectionConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const DIPARTIMENTI = [
  { label: 'Dipartimento di Arti Visive', value: 'arti-visive' },
  { label: 'Dipartimento di Arti della Progettazione', value: 'arti-della-progettazione' },
  { label: 'Dipartimento di Arti Tecnologiche', value: 'arti-tecnologiche' },
  {
    label: 'Dipartimento di Comunicazione e Didattica dell’Arte',
    value: 'comunicazione-e-didattica',
  },
] as const

export const nomeDipartimento = (valore?: string | null) =>
  DIPARTIMENTI.find((d) => d.value === valore)?.label ?? null

const redazione: Access = ({ req }) => hasRole(req.user, 'admin', 'vicedirezione', 'redazione')

export const Scuole: CollectionConfig = {
  slug: 'scuole',
  labels: { singular: 'Scuola', plural: 'Scuole' },
  typescript: { interface: 'Scuola' },
  admin: {
    useAsTitle: 'nome',
    description: 'Le scuole dell’Accademia, usate per filtrare avvisi e corsi.',
    defaultColumns: ['nome', 'sigla', 'dipartimento'],
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
    {
      name: 'dipartimento',
      label: 'Dipartimento',
      type: 'select',
      options: [...DIPARTIMENTI],
    },
    { name: 'descrizione', label: 'Descrizione', type: 'textarea' },
    {
      name: 'immagine',
      label: 'Immagine',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Facoltativa: sostituisce la foto di repertorio nella scheda della scuola in home.',
      },
    },
    {
      name: 'anteprimaIcona',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/IconaScuolaPannello' },
      },
    },
    slugField('nome'),
  ],
}
