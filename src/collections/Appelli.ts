import { filtroElenco, nascostaA } from '@/access/pannello'
import { erroreUtente } from '@/lib/errori'
import { type CollectionConfig, type Field, type FieldAccess } from 'payload'

import { LIVELLI, LIVELLO_LABELS, annoAccademicoCorrente, isAnnoAccademico } from '@/access/corsi'
import {
  SESSIONI_ESAMI,
  creaAppello,
  gestisceIscrizioni,
  modificaAppello,
} from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { creatoDaField } from '@/fields/creatoDa'
import type { Corso } from '@/payload-types'

/** Data, ora, aula e commissione: gli uffici sempre, il docente solo sui turni che ha aggiunto lui. */
const datiAppello: FieldAccess = ({ req, doc }) => {
  if (gestisceIscrizioni(req.user)) return true
  if (!doc) return true // creazione
  const autore = typeof doc.creatoDa === 'object' ? doc.creatoDa?.id : doc.creatoDa
  return autore === req.user?.id
}

const ORARIO = /^([01]?\d|2[0-3])[:.][0-5]\d$/

/**
 * Appello d'esame: una riga del calendario esami (docente, corso, livello, data, ora,
 * commissione, aula), a cui gli studenti si iscrivono nella finestra della sessione.
 * Lo creano segreteria, vicedirezione e admin; il docente può aggiungere turni ai propri corsi.
 */
export const Appelli: CollectionConfig = {
  slug: 'appelli',
  labels: { singular: 'Appello d’esame', plural: 'Appelli d’esame' },
  typescript: { interface: 'Appello' },
  admin: {
    hidden: nascostaA('appelli'),
    baseFilter: filtroElenco('appelli'),
    useAsTitle: 'titolo',
    description:
      'Le date d’esame di ogni corso, sessione per sessione. Gli studenti si iscrivono dal sito; il docente vede gli iscritti nella scheda “Iscritti”.',
    defaultColumns: ['titolo', 'data', 'ora', 'aula', 'sessione'],
    group: 'Iscrizioni ed esami',
    listSearchableFields: ['titolo', 'commissione', 'aula'],
  },
  defaultSort: 'data',
  access: {
    read: () => true,
    create: creaAppello,
    update: modificaAppello,
    delete: modificaAppello,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const d = { ...originalDoc, ...data }
        const corsoId = typeof d.corso === 'object' && d.corso ? d.corso.id : d.corso
        if (!corsoId) throw erroreUtente('Indica il corso.', 400)
        const corso = (await req.payload.findByID({
          collection: 'corsi',
          id: corsoId,
          depth: 1,
          req,
        })) as Corso

        // Il docente aggiunge turni solo ai propri corsi
        if (
          operation === 'create' &&
          !gestisceIscrizioni(req.user) &&
          hasRole(req.user, 'docente')
        ) {
          const suo = (corso.docenti ?? []).some(
            (doc) =>
              typeof doc === 'object' &&
              (typeof doc.account === 'object' ? doc.account?.id : doc.account) === req.user?.id,
          )
          if (!suo) {
            throw erroreUtente('Puoi aggiungere appelli solo ai tuoi corsi.', 403)
          }
        }

        // Livelli: se non indicati, quelli del corso
        if (!d.livelli?.length) data.livelli = corso.livelli
        const giorno = new Date(d.data).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'Europe/Rome',
        })
        data.titolo = `${corso.titolo} (${(d.livelli?.length ? d.livelli : (corso.livelli ?? []))
          .map((l: string) => LIVELLO_LABELS[l as keyof typeof LIVELLO_LABELS])
          .join(' e ')}), ${giorno}`
        return data
      },
    ],
  },
  fields: [
    { name: 'titolo', type: 'text', admin: { hidden: true } },
    {
      name: 'corso',
      label: 'Corso',
      type: 'relationship',
      relationTo: 'corsi',
      required: true,
      index: true,
      access: { update: datiAppello },
      admin: { description: 'Il docente viene dal corso.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'annoAccademico',
          label: 'Anno accademico',
          type: 'text',
          required: true,
          index: true,
          defaultValue: () => annoAccademicoCorrente(),
          validate: (value: string | null | undefined) =>
            isAnnoAccademico(value) || 'Scrivi l’anno come 2026/2027.',
          access: { update: datiAppello },
          admin: { width: '33%' },
        },
        {
          name: 'sessione',
          label: 'Sessione',
          type: 'select',
          required: true,
          index: true,
          options: SESSIONI_ESAMI.map((s) => ({ ...s })),
          access: { update: datiAppello },
          admin: { width: '33%' },
        },
        {
          name: 'livelli',
          label: 'Livello',
          type: 'select',
          hasMany: true,
          options: LIVELLI.map((value) => ({ value, label: LIVELLO_LABELS[value] })),
          access: { update: datiAppello },
          admin: {
            width: '34%',
            description:
              'Vuoto = quelli del corso. Usalo per dividere triennio e biennio in date diverse.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'data',
          label: 'Data',
          type: 'date',
          required: true,
          index: true,
          access: { update: datiAppello },
          admin: {
            width: '33%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
          },
        },
        {
          name: 'ora',
          label: 'Ora',
          type: 'text',
          required: true,
          access: { update: datiAppello },
          validate: (v: string | null | undefined) =>
            (!!v && ORARIO.test(v)) || 'Scrivi l’ora come 10:00.',
          admin: { width: '33%', placeholder: '10:00' },
        },
        {
          name: 'aula',
          label: 'Aula',
          type: 'text',
          access: { update: datiAppello },
          admin: { width: '34%', placeholder: 'C28' },
        },
      ],
    },
    {
      name: 'commissione',
      label: 'Commissione',
      type: 'text',
      access: { update: datiAppello },
      admin: {
        placeholder: 'Ajani, Amadio, Voghera',
        description: 'Cognomi separati da virgole. La vedono anche gli studenti.',
      },
    },
    {
      name: 'note',
      label: 'Note per gli studenti',
      type: 'text',
      admin: { placeholder: 'Es. “Per chi non ha sostenuto l’esame il 22/09”' },
    },
    {
      name: 'prorogaIscrizioni',
      label: 'Prolunga le iscrizioni fino al',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy, HH:mm',
          timeIntervals: 30,
        },
        description:
          'Facoltativo. Vale solo se è dopo la chiusura fissata dalla segreteria; le iscrizioni chiudono comunque una settimana prima dell’esame.',
      },
    },
    {
      name: 'scaricaIscritti',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/components/admin/ScaricaIscritti',
            clientProps: { collezione: 'iscrizioni-esami', riferimento: 'appello' },
          },
        },
      },
    },
    {
      name: 'iscritti',
      label: 'Studenti iscritti',
      type: 'join',
      collection: 'iscrizioni-esami',
      on: 'appello',
      defaultSort: 'nominativo',
      defaultLimit: 200,
      admin: {
        allowCreate: false,
        defaultColumns: ['nominativo', 'matricola', 'livello', 'email', 'createdAt'],
      },
    },
    {
      // Visibile solo agli uffici: il docente non legge gli account degli altri
      ...creatoDaField(),
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (_: unknown, __: unknown, { user }: { user: unknown }) =>
          gestisceIscrizioni(user as Parameters<typeof gestisceIscrizioni>[0]),
      },
    } as Field,
  ],
}
