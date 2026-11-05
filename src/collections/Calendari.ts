import type { CollectionConfig } from 'payload'

import { soloCalendari } from '@/access/calendari'
import { leggiPubblicati } from '@/access/corsi'
import { slugField } from '@/fields/slug'
import { TIPI_CALENDARIO, TIPO_LABELS, normalizzaRighe, type TipoCalendario } from '@/lib/calendari'

/**
 * Calendari compilati come tabelle dalla segreteria: sul sito diventano pagine HTML con filtri,
 * stampabili. Il PDF resta facoltativo, per chi lo vuole scaricare.
 */
export const Calendari: CollectionConfig = {
  slug: 'calendari',
  labels: { singular: 'Calendario', plural: 'Calendari' },
  typescript: { interface: 'Calendario' },
  admin: {
    useAsTitle: 'titolo',
    description:
      'Orario delle lezioni, esami e presentazioni: si compilano a tabella, il sito li mostra con filtri e li fa stampare.',
    defaultColumns: ['titolo', 'tipo', 'annoAccademico', 'updatedAt', '_status'],
    group: 'Didattica',
  },
  defaultSort: '-updatedAt',
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: leggiPubblicati,
    create: soloCalendari,
    update: soloCalendari,
    delete: soloCalendari,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.tipo) data.righe = normalizzaRighe(data.tipo as TipoCalendario, data.righe)
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'tipo',
          label: 'Tipo',
          type: 'select',
          required: true,
          defaultValue: 'lezioni',
          options: TIPI_CALENDARIO.map((value) => ({ value, label: TIPO_LABELS[value] })),
          admin: { width: '50%' },
        },
        {
          name: 'annoAccademico',
          label: 'Anno accademico',
          type: 'text',
          required: true,
          admin: { width: '50%', placeholder: '2026/2027' },
          validate: (v: unknown) =>
            typeof v === 'string' && /^\d{4}\/\d{4}$/.test(v)
              ? true
              : 'Scrivi l’anno così: 2026/2027.',
        },
      ],
    },
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 120,
      admin: { placeholder: 'Orario delle lezioni' },
    },
    {
      name: 'sottotitolo',
      label: 'Sottotitolo',
      type: 'text',
      maxLength: 160,
      admin: { description: 'Facoltativo, es. “Sessione estiva” o “Secondo semestre”.' },
    },
    slugField((d) =>
      [d.titolo, d.sottotitolo, d.annoAccademico].filter(Boolean).join(' ').replace('/', '-'),
    ),
    {
      name: 'avvertenze',
      label: 'Avvertenze',
      type: 'textarea',
      admin: {
        description:
          'Mostrate in un riquadro sopra la tabella, es. “Le aule potrebbero cambiare”. Una per riga.',
      },
    },
    {
      name: 'sedi',
      label: 'Sedi',
      type: 'textarea',
      admin: {
        description: 'Una per riga, es. “Sede centrale: via Accademia Albertina 6, Torino”.',
      },
    },
    {
      name: 'righe',
      label: 'Tabella',
      type: 'json',
      defaultValue: [],
      admin: {
        components: { Field: '/components/admin/TabellaCalendario#TabellaCalendario' },
      },
      validate: (value: unknown) =>
        Array.isArray(value) ? true : 'La tabella non è valida: ricarica la pagina e riprova.',
    },
    {
      name: 'pdf',
      label: 'PDF da scaricare',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Facoltativo: il sito permette già di stampare la tabella.',
      },
    },
  ],
}
