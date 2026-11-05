import type { CollectionConfig } from 'payload'

import { campoSoloDidattica, modificaDottorando, soloDidattica } from '@/access/corsi'
import { canAccessBackend } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const CURRICULA = ['new-media-art', 'processi-espositivi'] as const

export const CURRICULUM_LABELS: Record<(typeof CURRICULA)[number], string> = {
  'new-media-art': 'New Media Art',
  'processi-espositivi': 'Ricerca e critica dei processi espositivi contemporanei',
}

/** Ciclo di dottorato in numeri romani (XL, XLI…). */
const CICLO = /^[IVXLC]+$/

/**
 * Profili pubblici dei dottorandi del Dottorato di ricerca dell'Accademia, in
 * /dottorati/albertina/dottorandi. Come per i docenti, il profilo è separato dall'account:
 * il dottorando collegato aggiorna foto, biografia e progetto; il resto spetta alla vicedirezione.
 */
export const Dottorandi: CollectionConfig = {
  slug: 'dottorandi',
  labels: { singular: 'Dottorando', plural: 'Dottorandi' },
  typescript: { interface: 'Dottorando' },
  admin: {
    useAsTitle: 'nomeCompleto',
    description: 'Profili dei dottorandi, in /dottorati/albertina/dottorandi.',
    defaultColumns: ['nomeCompleto', 'ciclo', 'curriculum', 'attivo'],
    group: 'Didattica',
    listSearchableFields: ['nome', 'cognome', 'email', 'titoloProgetto'],
  },
  defaultSort: 'cognome',
  access: {
    read: () => true,
    create: soloDidattica,
    update: modificaDottorando,
    delete: soloDidattica,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const nome = (data.nome ?? originalDoc?.nome ?? '').trim()
        const cognome = (data.cognome ?? originalDoc?.cognome ?? '').trim()
        data.nomeCompleto = `${nome} ${cognome}`.trim()
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'nome',
          label: 'Nome',
          type: 'text',
          required: true,
          access: { update: campoSoloDidattica },
        },
        {
          name: 'cognome',
          label: 'Cognome',
          type: 'text',
          required: true,
          index: true,
          access: { update: campoSoloDidattica },
        },
      ],
    },
    {
      name: 'nomeCompleto',
      type: 'text',
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'email',
      label: 'Email istituzionale',
      type: 'email',
      access: { update: campoSoloDidattica },
      validate: (value: string | null | undefined) =>
        !value || /@albertina\.academy$/i.test(value) || 'Usa l’indirizzo @albertina.academy.',
    },
    {
      name: 'ciclo',
      label: 'Ciclo',
      type: 'text',
      maxLength: 10,
      index: true,
      access: { update: campoSoloDidattica },
      admin: { position: 'sidebar', description: 'In numeri romani, es. XLI.' },
      validate: (value: string | null | undefined) =>
        !value || CICLO.test(value) || 'Scrivi il ciclo in numeri romani maiuscoli, es. XLI.',
    },
    {
      name: 'curriculum',
      label: 'Curriculum',
      type: 'select',
      options: CURRICULA.map((value) => ({ value, label: CURRICULUM_LABELS[value] })),
      access: { update: campoSoloDidattica },
      admin: { position: 'sidebar' },
    },
    {
      name: 'tutor',
      label: 'Tutor',
      type: 'text',
      maxLength: 200,
      access: { update: campoSoloDidattica },
      admin: { position: 'sidebar', description: 'Nome e cognome, anche di più tutor.' },
    },
    {
      name: 'foto',
      label: 'Foto',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'Facoltativa. Formato quadrato o verticale.' },
    },
    {
      name: 'titoloProgetto',
      label: 'Titolo del progetto di ricerca',
      type: 'textarea',
      maxLength: 400,
    },
    {
      name: 'abstract',
      label: 'Abstract del progetto',
      type: 'richText',
    },
    { name: 'biografia', label: 'Biografia', type: 'richText' },
    {
      name: 'attivo',
      label: 'In corso',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: { update: campoSoloDidattica },
      admin: {
        position: 'sidebar',
        description: 'Togli la spunta a dottorato concluso: il profilo esce dall’elenco.',
      },
    },
    {
      name: 'account',
      label: 'Account collegato',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      access: {
        read: ({ req }) => canAccessBackend(req.user),
        create: campoSoloDidattica,
        update: campoSoloDidattica,
      },
      admin: {
        position: 'sidebar',
        description: 'L’utente con ruolo Dottorando che può modificare questo profilo.',
      },
    },
    slugField((d) => [d.nome, d.cognome].filter(Boolean).join(' ') || undefined),
  ],
}
