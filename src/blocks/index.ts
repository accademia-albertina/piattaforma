import type { Block, Field } from 'payload'

import { linkFields } from '@/fields/link'
import { rowLabel } from '@/fields/rowLabel'

/**
 * Blocchi con cui si compongono le pagine istituzionali.
 * Ognuno ha un componente in src/components/blocchi e va aggiunto a BLOCCHI qui sotto.
 */

const titoloFacoltativo: Field = {
  name: 'titolo',
  label: 'Titolo della sezione',
  type: 'text',
  admin: { description: 'Facoltativo. Diventa un titolo di livello 2 nella pagina.' },
}

export const BloccoTesto: Block = {
  slug: 'testo',
  labels: { singular: 'Testo', plural: 'Testi' },
  interfaceName: 'BloccoTesto',
  fields: [{ name: 'testo', label: 'Testo', type: 'richText', required: true }],
}

export const BloccoImmagine: Block = {
  slug: 'immagine',
  labels: { singular: 'Immagine', plural: 'Immagini' },
  admin: rowLabel('didascalia', 'Immagine'),
  interfaceName: 'BloccoImmagine',
  fields: [
    {
      name: 'immagine',
      label: 'Immagine',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { contains: 'image' } },
    },
    { name: 'didascalia', label: 'Didascalia', type: 'text' },
    {
      name: 'larghezza',
      label: 'Larghezza',
      type: 'select',
      defaultValue: 'testo',
      options: [
        { label: 'Come il testo', value: 'testo' },
        { label: 'Tutta la pagina', value: 'piena' },
      ],
    },
  ],
}

export const BloccoGalleria: Block = {
  slug: 'galleria',
  labels: { singular: 'Galleria', plural: 'Gallerie' },
  interfaceName: 'BloccoGalleria',
  fields: [
    titoloFacoltativo,
    {
      name: 'immagini',
      label: 'Immagini',
      type: 'array',
      minRows: 2,
      required: true,
      labels: { singular: 'Immagine', plural: 'Immagini' },
      fields: [
        {
          name: 'immagine',
          label: 'Immagine',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { contains: 'image' } },
        },
        { name: 'didascalia', label: 'Didascalia', type: 'text' },
      ],
    },
  ],
}

export const BloccoLink: Block = {
  slug: 'link',
  labels: { singular: 'Elenco di link', plural: 'Elenchi di link' },
  interfaceName: 'BloccoLink',
  fields: [
    titoloFacoltativo,
    {
      name: 'voci',
      label: 'Link',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Link', plural: 'Link' },
      admin: rowLabel('etichetta', 'Link'),
      fields: [
        ...linkFields,
        { name: 'descrizione', label: 'Descrizione breve', type: 'text', maxLength: 160 },
      ],
    },
  ],
}

export const BloccoFisarmonica: Block = {
  slug: 'fisarmonica',
  labels: { singular: 'Fisarmonica (domande e risposte)', plural: 'Fisarmoniche' },
  interfaceName: 'BloccoFisarmonica',
  fields: [
    titoloFacoltativo,
    {
      name: 'voci',
      label: 'Voci',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Voce', plural: 'Voci' },
      admin: rowLabel('titolo', 'Voce'),
      fields: [
        { name: 'titolo', label: 'Titolo (sempre visibile)', type: 'text', required: true },
        { name: 'testo', label: 'Contenuto (si apre al clic)', type: 'richText', required: true },
      ],
    },
  ],
}

export const BloccoContatti: Block = {
  slug: 'contatti',
  labels: { singular: 'Contatti', plural: 'Contatti' },
  interfaceName: 'BloccoContatti',
  fields: [
    titoloFacoltativo,
    {
      name: 'voci',
      label: 'Uffici o persone',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Contatto', plural: 'Contatti' },
      admin: rowLabel('nome', 'Contatto'),
      fields: [
        { name: 'nome', label: 'Ufficio o persona', type: 'text', required: true },
        { name: 'ruolo', label: 'Ruolo', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'telefono', label: 'Telefono', type: 'text' },
        {
          name: 'orari',
          label: 'Orari di ricevimento',
          type: 'textarea',
          admin: { description: 'Una riga per fascia, es. “Lunedì 9–12”.' },
        },
      ],
    },
  ],
}

export const BloccoAllegati: Block = {
  slug: 'allegati',
  labels: { singular: 'Allegati', plural: 'Allegati' },
  interfaceName: 'BloccoAllegati',
  fields: [
    { ...titoloFacoltativo, defaultValue: 'Allegati' } as Field,
    {
      name: 'documenti',
      label: 'Documenti',
      type: 'array',
      minRows: 1,
      required: true,
      labels: { singular: 'Allegato', plural: 'Allegati' },
      admin: rowLabel('nome', 'Allegato'),
      fields: [
        {
          name: 'nome',
          label: 'Nome mostrato',
          type: 'text',
          required: true,
          admin: { description: 'Descrivi il documento, es. “Regolamento didattico 2026”.' },
        },
        { name: 'file', label: 'File', type: 'upload', relationTo: 'media', required: true },
      ],
    },
  ],
}

export const BLOCCHI: Block[] = [
  BloccoTesto,
  BloccoImmagine,
  BloccoGalleria,
  BloccoLink,
  BloccoFisarmonica,
  BloccoContatti,
  BloccoAllegati,
]
