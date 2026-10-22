import type { Block, Field } from 'payload'

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

const linkFields: Field[] = [
  { name: 'etichetta', label: 'Testo del link', type: 'text', required: true },
  {
    name: 'tipo',
    label: 'Destinazione',
    type: 'radio',
    defaultValue: 'interno',
    options: [
      { label: 'Pagina del sito', value: 'interno' },
      { label: 'Indirizzo esterno', value: 'esterno' },
    ],
    admin: { layout: 'horizontal' },
  },
  {
    name: 'pagina',
    label: 'Pagina',
    type: 'relationship',
    relationTo: 'pagine',
    required: true,
    admin: { condition: (_, s) => s?.tipo !== 'esterno' },
  },
  {
    name: 'url',
    label: 'Indirizzo',
    type: 'text',
    required: true,
    admin: { condition: (_, s) => s?.tipo === 'esterno', placeholder: 'https://' },
    validate: (v: unknown, { siblingData }: { siblingData: { tipo?: string } }) => {
      if (siblingData?.tipo !== 'esterno') return true
      return typeof v === 'string' && /^https:\/\/\S+$/.test(v)
        ? true
        : 'Inserisci un indirizzo completo che inizi con https://'
    },
  },
]

export const BloccoTesto: Block = {
  slug: 'testo',
  labels: { singular: 'Testo', plural: 'Testi' },
  interfaceName: 'BloccoTesto',
  fields: [{ name: 'testo', label: 'Testo', type: 'richText', required: true }],
}

export const BloccoImmagine: Block = {
  slug: 'immagine',
  labels: { singular: 'Immagine', plural: 'Immagini' },
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
