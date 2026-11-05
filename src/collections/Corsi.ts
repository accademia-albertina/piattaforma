import type { CollectionConfig } from 'payload'

import {
  LIVELLI,
  LIVELLO_LABELS,
  annoAccademicoCorrente,
  campoSoloDidattica,
  isAnnoAccademico,
  leggiPubblicati,
  modificaCorso,
  soloDidattica,
} from '@/access/corsi'
import { rowLabel } from '@/fields/rowLabel'
import { slugField } from '@/fields/slug'
import { validaTitolo } from '@/fields/titolo'

export const SEMESTRI = [
  { value: 'primo', label: 'Primo semestre' },
  { value: 'secondo', label: 'Secondo semestre' },
  { value: 'annuale', label: 'Annuale' },
]

export const GIORNI = [
  { value: 'lunedi', label: 'Lunedì' },
  { value: 'martedi', label: 'Martedì' },
  { value: 'mercoledi', label: 'Mercoledì' },
  { value: 'giovedi', label: 'Giovedì' },
  { value: 'venerdi', label: 'Venerdì' },
  { value: 'sabato', label: 'Sabato' },
]

const ORARIO = /^([01]\d|2[0-3]):[0-5]\d$/
const validaOrario = (value: string | null | undefined) =>
  !value || ORARIO.test(value) || 'Scrivi l’orario come 09:30.'

/**
 * Un corso = una materia tenuta da un docente (o in co-docenza) in un anno accademico.
 * La stessa materia con docenti diversi è un corso diverso. Ogni anno si crea (o si duplica) il corso:
 * così resta l'archivio dei programmi.
 */
export const Corsi: CollectionConfig = {
  slug: 'corsi',
  labels: { singular: 'Corso', plural: 'Corsi' },
  typescript: { interface: 'Corso' },
  admin: {
    useAsTitle: 'titolo',
    description:
      'Corsi e programmi per anno accademico. Vicedirezione e admin creano i corsi e assegnano i docenti; il docente aggiorna il programma.',
    defaultColumns: ['titolo', 'livelli', 'docenti', 'annoAccademico', '_status'],
    group: 'Didattica',
    listSearchableFields: ['titolo', 'settore'],
  },
  defaultSort: 'titolo',
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: leggiPubblicati,
    create: soloDidattica,
    update: modificaCorso,
    delete: soloDidattica,
  },
  fields: [
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 160,
      access: { update: campoSoloDidattica },
      validate: validaTitolo,
      admin: {
        description: 'Solo il nome della materia, senza [T] o [B]: il livello si sceglie sotto.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Dati del corso',
          description: 'Li gestiscono vicedirezione e admin.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'livelli',
                  label: 'Livello',
                  type: 'select',
                  hasMany: true,
                  required: true,
                  index: true,
                  options: LIVELLI.map((value) => ({ value, label: LIVELLO_LABELS[value] })),
                  access: { update: campoSoloDidattica },
                  admin: { width: '50%' },
                },
                {
                  name: 'annoAccademico',
                  label: 'Anno accademico',
                  type: 'text',
                  required: true,
                  index: true,
                  defaultValue: () => annoAccademicoCorrente(),
                  validate: (value: string | null | undefined) =>
                    isAnnoAccademico(value) || 'Scrivi l’anno come 2026/2027.',
                  access: { update: campoSoloDidattica },
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'docenti',
              label: 'Docenti',
              type: 'relationship',
              relationTo: 'docenti',
              hasMany: true,
              required: true,
              access: { update: campoSoloDidattica },
              admin: { description: 'Più di un docente solo in caso di co-docenza.' },
            },
            {
              name: 'scuole',
              label: 'Piano di studio di riferimento',
              type: 'relationship',
              relationTo: 'scuole',
              hasMany: true,
              access: { update: campoSoloDidattica },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'crediti',
                  label: 'Crediti (CFA)',
                  type: 'number',
                  min: 1,
                  max: 30,
                  access: { update: campoSoloDidattica },
                  admin: { width: '33%' },
                },
                {
                  name: 'settore',
                  label: 'Settore artistico-disciplinare',
                  type: 'text',
                  access: { update: campoSoloDidattica },
                  admin: { width: '33%', description: 'Es. ABPR19 o il nome del settore.' },
                },
                {
                  name: 'areaDisciplinare',
                  label: 'Area disciplinare',
                  type: 'text',
                  access: { update: campoSoloDidattica },
                  admin: { width: '33%' },
                },
              ],
            },
          ],
        },
        {
          label: 'Programma',
          description: 'Lo aggiorna il docente titolare.',
          fields: [
            { name: 'descrizione', label: 'Obiettivi e contenuti', type: 'richText' },
            { name: 'bibliografia', label: 'Bibliografia', type: 'richText' },
            {
              type: 'row',
              fields: [
                {
                  name: 'esoneri',
                  label: 'Previsti esoneri',
                  type: 'checkbox',
                  admin: { width: '50%' },
                },
                {
                  name: 'revisioni',
                  label: 'Previste revisioni',
                  type: 'checkbox',
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'altreInformazioni', label: 'Altre informazioni', type: 'richText' },
          ],
        },
        {
          label: 'Orari',
          fields: [
            {
              name: 'orari',
              label: 'Orari delle lezioni',
              type: 'array',
              labels: { singular: 'Orario', plural: 'Orari' },
              admin: {
                ...rowLabel('giorno', 'Orario'),
                description: 'Una riga per ogni giorno di lezione.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'semestre',
                      label: 'Periodo',
                      type: 'select',
                      required: true,
                      options: SEMESTRI,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'giorno',
                      label: 'Giorno',
                      type: 'select',
                      required: true,
                      options: GIORNI,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'dalle',
                      label: 'Dalle',
                      type: 'text',
                      required: true,
                      validate: validaOrario,
                      admin: { width: '15%', placeholder: '09:30' },
                    },
                    {
                      name: 'alle',
                      label: 'Alle',
                      type: 'text',
                      required: true,
                      validate: validaOrario,
                      admin: { width: '15%', placeholder: '12:30' },
                    },
                    {
                      name: 'aula',
                      label: 'Aula',
                      type: 'text',
                      admin: { width: '20%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    slugField((d) => {
      if (typeof d.titolo !== 'string') return undefined
      const livelli = Array.isArray(d.livelli) ? d.livelli.join(' ') : ''
      return [d.titolo, livelli, d.annoAccademico].filter(Boolean).join(' ')
    }),
  ],
}
