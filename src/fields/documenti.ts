import type { ArrayField } from 'payload'

import { rowLabel } from './rowLabel'

/**
 * Elenco di documenti da scaricare: per ognuno un nome e un file caricato oppure un link
 * (i documenti importati dal sito attuale restano link ai file di albertina-academy.it).
 */
export function documentiField(opzioni: { nota?: boolean } = {}): ArrayField {
  return {
    name: 'documenti',
    label: 'Documenti',
    type: 'array',
    labels: { singular: 'Documento', plural: 'Documenti' },
    admin: rowLabel('nome', 'Documento'),
    fields: [
      {
        name: 'nome',
        label: 'Nome mostrato',
        type: 'text',
        required: true,
        admin: {
          description: 'Es. “Bando di selezione – scadenza 18/12/2026” o “Graduatoria definitiva”.',
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'file',
            label: 'File',
            type: 'upload',
            relationTo: 'media',
            admin: { width: '50%' },
          },
          {
            name: 'url',
            label: 'Oppure link',
            type: 'text',
            admin: { width: '50%', placeholder: 'https://…' },
            validate: (v: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
              if (typeof v === 'string' && v.trim() && !/^https?:\/\//.test(v.trim()))
                return 'Il link deve iniziare con https://'
              if (!siblingData?.file && !(typeof v === 'string' && v.trim()))
                return 'Carica un file oppure scrivi un link.'
              return true
            },
          },
        ],
      },
      ...(opzioni.nota
        ? [
            {
              name: 'nota',
              label: 'Nota',
              type: 'textarea' as const,
              admin: { description: 'Facoltativa, mostrata sotto il documento.', rows: 2 },
            },
          ]
        : []),
    ],
  }
}
