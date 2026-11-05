import type { CollectionConfig } from 'payload'

import { soloTrasparenza } from '@/access/albo'
import { leggiPubblicati } from '@/access/corsi'
import { documentiField } from '@/fields/documenti'
import { slugField } from '@/fields/slug'
import { SEZIONI_TRASPARENZA } from '@/lib/albo'
import { validaTitolo } from '@/fields/titolo'
import { linkSulSito } from '@/fields/linkSulSito'

/**
 * Amministrazione trasparente: una voce per ogni sottosezione prevista dal D.Lgs. 33/2013,
 * con testo e documenti. La data di aggiornamento si mostra sul sito, come richiesto dalla norma.
 */
export const Trasparenza: CollectionConfig = {
  slug: 'trasparenza',
  labels: { singular: 'Sottosezione', plural: 'Amministrazione trasparente' },
  typescript: { interface: 'Trasparenza' },
  admin: {
    useAsTitle: 'titolo',
    description:
      'Sottosezioni dell’Amministrazione trasparente. Aggiorna i documenti qui: la data di aggiornamento sul sito cambia da sola.',
    defaultColumns: ['titolo', 'sezione', 'aggiornatoIl', '_status'],
    group: 'Uffici',
    listSearchableFields: ['titolo', 'sezione'],
  },
  defaultSort: 'titolo',
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: leggiPubblicati,
    create: soloTrasparenza,
    update: soloTrasparenza,
    delete: soloTrasparenza,
  },
  hooks: {
    beforeChange: [
      ({ data, context }) => {
        // L'importazione dal sito attuale conserva la data originale.
        if (!context?.importazione) data.aggiornatoIl = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    linkSulSito('/amministrazione-trasparente/'),
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 200,
      validate: validaTitolo,
    },
    {
      name: 'sezione',
      label: 'Sezione',
      type: 'select',
      required: true,
      index: true,
      options: SEZIONI_TRASPARENZA.map((value) => ({ value, label: value })),
    },
    {
      name: 'testo',
      label: 'Testo',
      type: 'textarea',
      admin: {
        rows: 6,
        description: 'Facoltativo. Un paragrafo per riga vuota; gli indirizzi web diventano link.',
      },
    },
    documentiField({ nota: true }),
    {
      name: 'aggiornatoIl',
      label: 'Ultimo aggiornamento',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, date: { displayFormat: 'd MMM yyyy' } },
    },
    slugField('titolo'),
  ],
}
