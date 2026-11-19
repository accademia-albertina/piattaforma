import type { Block, Field } from 'payload'

import { linkFields } from '@/fields/link'
import { etichettaBlocco, rowLabel } from '@/fields/rowLabel'

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
  admin: etichettaBlocco('Testo'),
  interfaceName: 'BloccoTesto',
  fields: [{ name: 'testo', label: 'Testo', type: 'richText', required: true }],
}

export const BloccoImmagine: Block = {
  slug: 'immagine',
  labels: { singular: 'Immagine', plural: 'Immagini' },
  admin: etichettaBlocco('Immagine'),
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
  admin: etichettaBlocco('Galleria'),
  interfaceName: 'BloccoGalleria',
  fields: [
    titoloFacoltativo,
    {
      name: 'aspetto',
      label: 'Aspetto',
      type: 'select',
      defaultValue: 'griglia',
      options: [
        { label: 'Griglia nel testo', value: 'griglia' },
        { label: 'Fascia a tutta larghezza in fondo alla pagina', value: 'fascia' },
      ],
      admin: {
        description:
          'Fascia: le foto affiancate da bordo a bordo, si allargano al passaggio del mouse (es. le sedi).',
      },
    },
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
  admin: etichettaBlocco('Elenco di link'),
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
  admin: etichettaBlocco('Fisarmonica'),
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
  admin: etichettaBlocco('Contatti'),
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
  admin: etichettaBlocco('Allegati'),
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

export const BloccoDocumento: Block = {
  slug: 'documento',
  labels: { singular: 'Documento in evidenza', plural: 'Documenti in evidenza' },
  admin: etichettaBlocco('Documento'),
  interfaceName: 'BloccoDocumento',
  fields: [
    {
      name: 'nome',
      label: 'Titolo del documento',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: { description: 'Es. “Regolamento tasse 2026-27”.' },
    },
    { name: 'descrizione', label: 'Descrizione breve', type: 'text', maxLength: 240 },
    {
      name: 'file',
      label: 'File',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'I PDF si vedono in anteprima nella pagina (da tablet in su), con i pulsanti Apri e Scarica.',
      },
    },
    {
      name: 'anteprima',
      label: 'Mostra l’anteprima del PDF nella pagina',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Toglila quando il contenuto del PDF è già scritto nella pagina.',
      },
    },
  ],
}

export const BloccoPlanimetria: Block = {
  slug: 'planimetria',
  labels: { singular: 'Planimetria della sede', plural: 'Planimetrie della sede' },
  admin: etichettaBlocco('Planimetria'),
  interfaceName: 'BloccoPlanimetria',
  fields: [
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      maxLength: 120,
      admin: {
        description:
          'Vuoto = “Planimetria della sede”. Aule e uffici dei piani sono nel codice del sito: per cambiarli chiedi a Fede.',
      },
    },
  ],
}

export const BloccoGuidaStudenti: Block = {
  slug: 'guidaStudenti',
  labels: { singular: 'Guida per gli studenti', plural: 'Guide per gli studenti' },
  admin: etichettaBlocco('Guida per gli studenti'),
  interfaceName: 'BloccoGuidaStudenti',
  fields: [
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      maxLength: 120,
      admin: {
        description:
          'Facoltativo, sopra la guida. Passi e schermate sono nel codice del sito (gli stessi di “La mia area”): per cambiarli chiedi a Fede.',
      },
    },
  ],
}

export const BloccoMappa: Block = {
  slug: 'mappa',
  labels: { singular: 'Mappa', plural: 'Mappe' },
  admin: etichettaBlocco('Mappa'),
  interfaceName: 'BloccoMappa',
  fields: [
    {
      name: 'indirizzo',
      label: 'Indirizzo',
      type: 'text',
      required: true,
      defaultValue: 'Via Accademia Albertina 6, 10123 Torino',
      admin: { description: 'Come lo cercheresti su Google Maps.' },
    },
    {
      name: 'nome',
      label: 'Nome del luogo',
      type: 'text',
      defaultValue: 'Accademia Albertina di Belle Arti',
      admin: {
        description: 'Per chi usa il lettore di schermo e per il link “Apri in Google Maps”.',
      },
    },
  ],
}

export const BloccoAvvisiAmmissioni: Block = {
  slug: 'avvisiAmmissioni',
  labels: { singular: 'Avvisi di ammissione', plural: 'Avvisi di ammissione' },
  admin: etichettaBlocco('Avvisi di ammissione'),
  interfaceName: 'BloccoAvvisiAmmissioni',
  fields: [
    {
      name: 'titolo',
      label: 'Titolo della sezione',
      type: 'text',
      maxLength: 120,
      defaultValue: 'Avvisi dei coordinatori',
      admin: {
        description:
          'Gli avvisi si aggiornano da soli: li scrivono i coordinatori di scuola in Avvisi, categoria “Ammissioni”. Una voce per ogni scuola che ha avvisi.',
      },
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
  BloccoDocumento,
  BloccoPlanimetria,
  BloccoGuidaStudenti,
  BloccoMappa,
  BloccoAvvisiAmmissioni,
]
