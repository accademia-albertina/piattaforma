import type { CollectionConfig } from 'payload'

import { soloAlbo } from '@/access/albo'
import { leggiPubblicati } from '@/access/corsi'
import { documentiField } from '@/fields/documenti'
import { slugField } from '@/fields/slug'
import { SEZIONE_ALBO, SEZIONI_ALBO } from '@/lib/albo'

/**
 * Atti dell'Albo online: un bando, una procedura o una comunicazione con i suoi documenti
 * (bando, nomina della commissione, graduatoria…). Li pubblicano gli uffici dal pannello.
 */
export const Albo: CollectionConfig = {
  slug: 'albo',
  labels: { singular: 'Atto dell’Albo', plural: 'Albo online' },
  typescript: { interface: 'AttoAlbo' },
  admin: {
    useAsTitle: 'titolo',
    description:
      'Bandi, procedure e comunicazioni dell’Albo online. Aggiungi i nuovi documenti (nomina, verbali, graduatoria) allo stesso atto.',
    defaultColumns: ['titolo', 'sezione', 'categoria', 'pubblicatoIl', '_status'],
    group: 'Uffici',
    listSearchableFields: ['titolo', 'categoria'],
  },
  defaultSort: '-pubblicatoIl',
  versions: { drafts: true, maxPerDoc: 30 },
  access: { read: leggiPubblicati, create: soloAlbo, update: soloAlbo, delete: soloAlbo },
  fields: [
    { name: 'titolo', label: 'Titolo', type: 'text', required: true, maxLength: 300 },
    {
      type: 'row',
      fields: [
        {
          name: 'sezione',
          label: 'Sezione',
          type: 'select',
          required: true,
          index: true,
          options: SEZIONI_ALBO.map((value) => ({ value, label: SEZIONE_ALBO[value].titolo })),
          admin: { width: '50%' },
        },
        {
          name: 'categoria',
          label: 'Categoria',
          type: 'text',
          required: true,
          index: true,
          admin: {
            width: '50%',
            description:
              'Usa una categoria già esistente, es. “Personale docente a contratto”, “Servizi”, “Scioperi”.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'pubblicatoIl',
          label: 'Data di pubblicazione',
          type: 'date',
          required: true,
          index: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: '33%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
          },
        },
        {
          name: 'scadenza',
          label: 'Scadenza',
          type: 'date',
          admin: {
            width: '33%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
            description: 'Facoltativa: termine per presentare la domanda.',
          },
        },
        {
          name: 'annoAccademico',
          label: 'Anno accademico',
          type: 'text',
          admin: { width: '33%', placeholder: '2026/2027' },
        },
      ],
    },
    {
      name: 'descrizione',
      label: 'Descrizione',
      type: 'textarea',
      admin: {
        description: 'Facoltativa: due righe per spiegare l’atto, se il titolo non basta.',
        rows: 3,
      },
    },
    documentiField(),
    slugField('titolo'),
  ],
}
