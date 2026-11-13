import { nascostaA } from '@/access/pannello'
import type { Access, CollectionConfig, GroupField } from 'payload'

import { hasRole } from '@/access/roles'
import { documentiField } from '@/fields/documenti'
import { linkSulSito } from '@/fields/linkSulSito'
import { rowLabel } from '@/fields/rowLabel'
import { slugField } from '@/fields/slug'

export const DIPARTIMENTI = [
  { label: 'Dipartimento di Arti Visive', value: 'arti-visive' },
  { label: 'Dipartimento di Arti della Progettazione', value: 'arti-della-progettazione' },
  { label: 'Dipartimento di Arti Tecnologiche', value: 'arti-tecnologiche' },
  {
    label: 'Dipartimento di Comunicazione e Didattica dell’Arte',
    value: 'comunicazione-e-didattica',
  },
] as const

export const nomeDipartimento = (valore?: string | null) =>
  DIPARTIMENTI.find((d) => d.value === valore)?.label ?? null

/** Indirizzi YouTube accettati per il video della scuola. */
export const RE_YOUTUBE =
  /^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/

/** Id del video YouTube da un indirizzo, o null. */
export const idYoutube = (url?: string | null) =>
  url ? (RE_YOUTUBE.exec(url.trim())?.[1] ?? null) : null

/**
 * Un percorso della scuola (triennio o biennio): sezioni di testo libere, perché i titoli
 * cambiano tra le scuole (es. "Prospettive occupazionali" nel triennio, "Profili
 * professionali" nel biennio), e i piani di studio da scaricare.
 */
const percorso = (name: 'triennio' | 'biennio', label: string, titolo: string): GroupField => ({
  name,
  label,
  type: 'group',
  admin: { hideGutter: true },
  fields: [
    {
      name: 'attivo',
      label: `${titolo} attivo`,
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Togli la spunta se la scuola non ha questo percorso (es. Cinema senza biennio).',
      },
    },
    {
      name: 'sezioni',
      label: 'Sezioni',
      type: 'array',
      labels: { singular: 'Sezione', plural: 'Sezioni' },
      admin: {
        ...rowLabel('titolo', 'Sezione'),
        description:
          'Es. Obiettivi formativi, Prospettive occupazionali, Requisiti di accesso, Prova di accesso, Prova finale.',
        condition: (_, sibling) => sibling?.attivo !== false,
      },
      fields: [
        { name: 'titolo', label: 'Titolo', type: 'text', required: true },
        { name: 'testo', label: 'Testo', type: 'richText' },
      ],
    },
    {
      ...documentiField(),
      name: 'piani',
      label: 'Piani di studio',
      labels: { singular: 'Piano di studio', plural: 'Piani di studio' },
      admin: {
        ...documentiField().admin,
        description: 'Uno per coorte, es. “Immatricolati dall’A.A. 2025/2026”.',
        condition: (_, sibling) => sibling?.attivo !== false,
      },
    },
  ],
})

const gestisceScuole: Access = ({ req }) => hasRole(req.user, 'admin', 'vicedirezione')

export const Scuole: CollectionConfig = {
  slug: 'scuole',
  labels: { singular: 'Scuola', plural: 'Scuole' },
  typescript: { interface: 'Scuola' },
  admin: {
    hidden: nascostaA('scuole'),
    useAsTitle: 'nome',
    description: 'Le scuole dell’Accademia: pagina pubblica in /scuole, filtri di avvisi e corsi.',
    defaultColumns: ['nome', 'sigla', 'dipartimento'],
    group: 'Didattica',
  },
  defaultSort: 'nome',
  access: {
    read: () => true,
    create: gestisceScuole,
    update: gestisceScuole,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  fields: [
    linkSulSito('/scuole/'),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Scuola',
          fields: [
            { name: 'nome', label: 'Nome', type: 'text', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'sigla',
                  label: 'Sigla',
                  type: 'text',
                  admin: {
                    width: '30%',
                    description: 'Forma breve usata nei filtri, es. PAI, NTA.',
                  },
                },
                {
                  name: 'dipartimento',
                  label: 'Dipartimento',
                  type: 'select',
                  options: [...DIPARTIMENTI],
                  admin: { width: '70%' },
                },
              ],
            },
            {
              name: 'descrizione',
              label: 'Presentazione',
              type: 'textarea',
              admin: { description: 'Due o tre frasi in apertura della pagina della scuola.' },
            },
            {
              name: 'immagine',
              label: 'Immagine',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Facoltativa: sostituisce la foto di repertorio nella scheda in home e nella pagina.',
              },
            },
            {
              name: 'video',
              label: 'Video di presentazione',
              type: 'text',
              admin: { placeholder: 'https://www.youtube.com/watch?v=…' },
              validate: (v: unknown) =>
                !v || (typeof v === 'string' && idYoutube(v))
                  ? true
                  : 'Incolla l’indirizzo di un video YouTube.',
            },
          ],
        },
        { label: 'Triennio', fields: [percorso('triennio', 'Triennio', 'Triennio')] },
        { label: 'Biennio', fields: [percorso('biennio', 'Biennio', 'Biennio specialistico')] },
        {
          label: 'Persone',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'coordinatoreDipartimento',
                  label: 'Coordinatore dipartimento',
                  type: 'relationship',
                  relationTo: 'docenti',
                  admin: { width: '50%' },
                },
                {
                  name: 'coordinatoreScuola',
                  label: 'Coordinatore scuola',
                  type: 'relationship',
                  relationTo: 'docenti',
                  admin: {
                    width: '50%',
                    description:
                      'Gli altri docenti si prendono dai loro profili (Docenti → Scuole): non serve elencarli qui.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'anteprimaIcona',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/IconaScuolaPannello' },
      },
    },
    slugField('nome'),
  ],
}
