import { nascostaA } from '@/access/pannello'
import type { CollectionConfig } from 'payload'

import { rowLabel } from '@/fields/rowLabel'

import { curaCatalogo, eliminaPubblicazione } from '@/access/pubblicazioni'
import { linkSulSito } from '@/fields/linkSulSito'
import { slugField } from '@/fields/slug'
import { validaTitolo } from '@/fields/titolo'

export const PERCORSO_PRESS = '/accademia/albertina-press'

export const COLLANE = [
  { value: 'arcate', label: 'Arcate' },
  { value: 'galleria', label: 'Galleria' },
  { value: 'hbitat', label: 'Hbitat' },
  { value: 'quaderni', label: 'Quaderni dell’Accademia' },
  { value: 'r-esistenze', label: 'R-esistenze' },
  { value: 'visioni', label: 'Visioni' },
] as const

export type Collana = (typeof COLLANE)[number]['value']

export const nomeCollana = (valore?: string | null) =>
  COLLANE.find((c) => c.value === valore)?.label ?? null

/**
 * Catalogo della casa editrice Albertina Press, in /accademia/albertina-press.
 * Ogni volume ha la sua scheda: copertina, dati bibliografici, descrizione e indice.
 */
export const Pubblicazioni: CollectionConfig = {
  slug: 'pubblicazioni',
  labels: { singular: 'Pubblicazione', plural: 'Albertina Press' },
  typescript: { interface: 'Pubblicazione' },
  admin: {
    hidden: nascostaA('pubblicazioni'),
    useAsTitle: 'titolo',
    description: 'Il catalogo della casa editrice Albertina Press, in /accademia/albertina-press.',
    defaultColumns: ['numero', 'titolo', 'collana', 'anno'],
    group: 'Contenuti',
    listSearchableFields: ['titolo', 'autori', 'isbn'],
  },
  defaultSort: '-numero',
  access: {
    read: () => true,
    create: curaCatalogo,
    update: curaCatalogo,
    delete: eliminaPubblicazione,
  },
  fields: [
    linkSulSito(`${PERCORSO_PRESS}/`),
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 250,
      validate: validaTitolo,
    },
    {
      name: 'autori',
      label: 'Autori e curatori',
      type: 'text',
      maxLength: 500,
      admin: { description: 'Come sul frontespizio, es. “a cura di Alberto Cottino; testi di…”.' },
    },
    {
      name: 'copertina',
      label: 'Copertina',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'descrizione',
      label: 'Descrizione',
      type: 'textarea',
    },
    {
      name: 'indice',
      label: 'Indice',
      type: 'array',
      labels: { singular: 'Voce', plural: 'Voci' },
      admin: {
        initCollapsed: true,
        description: 'Facoltativo. Una voce per capitolo o saggio.',
        ...rowLabel('titolo', 'Voce'),
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'pagina',
              label: 'Pagina',
              type: 'text',
              maxLength: 10,
              admin: { width: '15%' },
            },
            {
              name: 'titolo',
              label: 'Titolo',
              type: 'text',
              required: true,
              admin: { width: '50%' },
            },
            { name: 'autori', label: 'Autori', type: 'text', admin: { width: '35%' } },
          ],
        },
      ],
    },
    {
      name: 'numero',
      label: 'Numero di catalogo',
      type: 'number',
      min: 1,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'collana',
      label: 'Collana',
      type: 'select',
      options: [...COLLANE],
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'anno',
      label: 'Anno',
      type: 'number',
      min: 1900,
      max: 2100,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'luogoAnno',
      label: 'Luogo, editore e anno',
      type: 'text',
      maxLength: 200,
      admin: {
        position: 'sidebar',
        description: 'Es. “Torino, Milano (Silvana Editoriale), 2017”.',
      },
    },
    {
      name: 'pagine',
      label: 'Pagine',
      type: 'number',
      min: 1,
      admin: { position: 'sidebar' },
    },
    {
      name: 'dimensioni',
      label: 'Formato',
      type: 'text',
      maxLength: 40,
      admin: { position: 'sidebar', description: 'Es. “24 cm”.' },
    },
    {
      name: 'lingua',
      label: 'Lingua',
      type: 'text',
      maxLength: 80,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isbn',
      label: 'ISBN',
      type: 'text',
      maxLength: 20,
      admin: { position: 'sidebar' },
      validate: (value: string | null | undefined) =>
        !value || /^[0-9][0-9-]{8,16}[0-9X]$/.test(value) || 'Scrivi l’ISBN con cifre e trattini.',
    },
    {
      name: 'prezzo',
      label: 'Prezzo (€)',
      type: 'number',
      min: 0,
      admin: { position: 'sidebar', step: 0.01 },
    },
    slugField('titolo'),
  ],
}
