import type { Access, CollectionConfig, Where } from 'payload'

import {
  CATEGORIA_LABELS,
  CATEGORIE_AVVISI,
  categorieConsentite,
  categorieNonConsentite,
  puoScrivereAvvisi,
} from '@/access/avvisi'
import { canAccessBackend, isAdmin } from '@/access/roles'
import { rowLabel } from '@/fields/rowLabel'
import { slugField } from '@/fields/slug'

/** Il pubblico vede solo gli avvisi pubblicati; chi lavora nel pannello vede anche le bozze. */
const read: Access = ({ req }) => {
  if (canAccessBackend(req.user)) return true
  return { _status: { equals: 'published' } } satisfies Where
}

/** Si modifica un avviso solo se tutte le sue categorie rientrano tra quelle del proprio ruolo. */
const updateOrDelete: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  if (!puoScrivereAvvisi(req.user)) return false
  return { categorie: { not_in: categorieNonConsentite(req.user) } } satisfies Where
}

export const Avvisi: CollectionConfig = {
  slug: 'avvisi',
  labels: { singular: 'Avviso', plural: 'Avvisi' },
  typescript: { interface: 'Avviso' },
  admin: {
    useAsTitle: 'titolo',
    description: 'Comunicazioni per studenti e docenti, in /avvisi e in homepage.',
    defaultColumns: ['titolo', 'categorie', 'pubblicatoIl', '_status'],
    group: 'Contenuti',
    listSearchableFields: ['titolo', 'sommario'],
  },
  defaultSort: '-pubblicatoIl',
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read,
    create: ({ req }) => puoScrivereAvvisi(req.user),
    update: updateOrDelete,
    delete: updateOrDelete,
  },
  fields: [
    { name: 'titolo', label: 'Titolo', type: 'text', required: true, maxLength: 160 },
    {
      name: 'sommario',
      label: 'Sommario',
      type: 'textarea',
      maxLength: 240,
      admin: {
        description:
          'Una o due frasi mostrate negli elenchi e nei risultati di Google. Se vuoto si usa l’inizio del testo.',
      },
    },
    {
      name: 'categorie',
      label: 'Categorie',
      type: 'select',
      hasMany: true,
      required: true,
      index: true,
      options: CATEGORIE_AVVISI.map((value) => ({ value, label: CATEGORIA_LABELS[value] })),
      // Nel pannello ognuno vede solo le categorie del proprio ruolo…
      filterOptions: ({ options, req }) => {
        const ok = new Set<string>(categorieConsentite(req.user))
        return options.filter((o) => ok.has(typeof o === 'string' ? o : o.value))
      },
      // …e il server rifiuta comunque le altre.
      validate: (value, { req }) => {
        if (!value || (Array.isArray(value) && value.length === 0))
          return 'Scegli almeno una categoria.'
        if (!req.user) return true
        const ok = new Set<string>(categorieConsentite(req.user))
        const vietate = (value as string[]).filter((v) => !ok.has(v))
        return vietate.length === 0
          ? true
          : `Il tuo ruolo non può pubblicare in: ${vietate.map((v) => CATEGORIA_LABELS[v as keyof typeof CATEGORIA_LABELS] ?? v).join(', ')}.`
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'scuole',
      label: 'Scuole',
      type: 'relationship',
      relationTo: 'scuole',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Lascia vuoto se l’avviso riguarda tutta l’Accademia.',
      },
    },
    {
      name: 'pubblicatoIl',
      label: 'Data di pubblicazione',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy, HH:mm',
          timeFormat: 'HH:mm',
          overrides: { timeCaption: 'Ora' },
        },
      },
    },
    {
      name: 'immagine',
      label: 'Immagine',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: {
        description:
          'Facoltativa. Per gli avvisi In evidenza è lo sfondo dello slider in homepage (formato orizzontale, almeno 1920 px).',
      },
    },
    { name: 'contenuto', label: 'Testo', type: 'richText' },
    {
      name: 'allegati',
      label: 'Allegati',
      type: 'array',
      labels: { singular: 'Allegato', plural: 'Allegati' },
      admin: rowLabel('nome', 'Allegato'),
      fields: [
        {
          name: 'nome',
          label: 'Nome mostrato',
          type: 'text',
          required: true,
          admin: {
            description: 'Descrivi il documento, es. “Calendario esami sessione invernale”.',
          },
        },
        { name: 'file', label: 'File', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    slugField('titolo'),
    {
      name: 'autore',
      label: 'Autore',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
      access: { update: ({ req }) => isAdmin(req.user) },
      hooks: {
        beforeChange: [
          ({ value, operation, req }) => (operation === 'create' && req.user ? req.user.id : value),
        ],
      },
    },
  ],
}
