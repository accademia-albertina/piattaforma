import type { Field } from 'payload'

/**
 * Campi di un link usati da blocchi e menu: una pagina del sito, un indirizzo interno
 * (es. /avvisi?categoria=esami) oppure un sito esterno.
 */
export const linkFields: Field[] = [
  { name: 'etichetta', label: 'Testo del link', type: 'text', required: true },
  {
    name: 'tipo',
    label: 'Destinazione',
    type: 'radio',
    defaultValue: 'interno',
    options: [
      { label: 'Pagina', value: 'interno' },
      { label: 'Indirizzo del sito', value: 'percorso' },
      { label: 'Sito esterno', value: 'esterno' },
    ],
    admin: { layout: 'horizontal' },
  },
  {
    name: 'pagina',
    label: 'Pagina',
    type: 'relationship',
    relationTo: 'pagine',
    required: true,
    admin: { condition: (_, s) => !s?.tipo || s.tipo === 'interno' },
  },
  {
    name: 'url',
    label: 'Indirizzo',
    type: 'text',
    required: true,
    admin: {
      condition: (_, s) => s?.tipo === 'esterno' || s?.tipo === 'percorso',
      description: 'Sito esterno: https://… · Indirizzo del sito: /avvisi, /cerca…',
    },
    validate: (v: unknown, { siblingData }: { siblingData: { tipo?: string } }) => {
      if (siblingData?.tipo === 'esterno')
        return typeof v === 'string' && /^https:\/\/\S+$/.test(v)
          ? true
          : 'Inserisci un indirizzo completo che inizi con https://'
      if (siblingData?.tipo === 'percorso')
        return typeof v === 'string' && /^\/(?!\/)\S*$/.test(v)
          ? true
          : 'Inserisci un indirizzo del sito che inizi con /, es. /avvisi'
      return true
    },
  },
]
