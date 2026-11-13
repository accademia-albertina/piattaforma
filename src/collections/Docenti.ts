import { filtroElenco, nascostaA } from '@/access/pannello'
import type { CollectionConfig } from 'payload'

import {
  RUOLI_DOCENTE,
  RUOLO_DOCENTE_LABELS,
  campoSoloDidattica,
  modificaDocente,
  soloDidattica,
} from '@/access/corsi'
import { canAccessBackend } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { linkSulSito } from '@/fields/linkSulSito'

/**
 * Profilo pubblico del docente. È separato dall'account (Utenti): il profilo esiste anche
 * per chi non ha ancora un accesso o non insegna più, e resta collegato ai corsi degli anni passati.
 */
export const Docenti: CollectionConfig = {
  slug: 'docenti',
  labels: { singular: 'Docente', plural: 'Docenti' },
  typescript: { interface: 'Docente' },
  admin: {
    hidden: nascostaA('docenti'),
    baseFilter: filtroElenco('docenti'),
    useAsTitle: 'nomeCompleto',
    description: 'Profili pubblici dei docenti, in /docenti e nelle schede dei corsi.',
    defaultColumns: ['nomeCompleto', 'ruolo', 'scuole', 'attivo'],
    group: 'Didattica',
    listSearchableFields: ['nome', 'cognome', 'email'],
  },
  defaultSort: 'cognome',
  access: {
    read: () => true,
    create: soloDidattica,
    update: modificaDocente,
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
    linkSulSito('/docenti/'),
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
      name: 'ruolo',
      label: 'Ruolo',
      type: 'select',
      options: RUOLI_DOCENTE.map((value) => ({ value, label: RUOLO_DOCENTE_LABELS[value] })),
      access: { update: campoSoloDidattica },
      admin: { position: 'sidebar' },
    },
    {
      name: 'scuole',
      label: 'Scuole',
      type: 'relationship',
      relationTo: 'scuole',
      hasMany: true,
      access: { update: campoSoloDidattica },
      admin: {
        position: 'sidebar',
        description:
          'La prima scuola è l’afferenza principale; le altre sono pro-afferenze. Trascina per cambiare l’ordine.',
      },
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
      name: 'ricevimento',
      label: 'Ricevimento',
      type: 'text',
      maxLength: 200,
      admin: {
        description: 'Es. “Mercoledì 16–17, su appuntamento via email”. Se vuoto: su appuntamento.',
      },
    },
    { name: 'biografia', label: 'Biografia', type: 'richText' },
    {
      name: 'cv',
      label: 'Curriculum (PDF)',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { equals: 'application/pdf' } },
    },
    {
      name: 'attivo',
      label: 'In servizio',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: { update: campoSoloDidattica },
      admin: {
        position: 'sidebar',
        description:
          'Togli la spunta per chi non insegna più: il profilo resta per i corsi passati.',
      },
    },
    {
      name: 'account',
      label: 'Account collegato',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      access: {
        // Visibile solo nel pannello (serve anche ai permessi del docente sui propri corsi).
        read: ({ req }) => canAccessBackend(req.user),
        create: campoSoloDidattica,
        update: campoSoloDidattica,
      },
      admin: {
        position: 'sidebar',
        description: 'L’utente che può modificare questo profilo e il programma dei suoi corsi.',
      },
    },
    slugField((d) => [d.nome, d.cognome].filter(Boolean).join(' ') || undefined),
  ],
}
