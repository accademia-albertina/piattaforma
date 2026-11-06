import { nascostaA } from '@/access/pannello'
import { APIError, type CollectionConfig } from 'payload'

import { annoAccademicoCorrente, isAnnoAccademico } from '@/access/corsi'
import {
  PERIODI_CORSI,
  SESSIONI_ESAMI,
  TIPI_FINESTRA,
  TIPO_FINESTRA_LABELS,
  etichettaPeriodo,
  soloGestioneIscrizioni,
  type TipoFinestra,
} from '@/access/iscrizioni'

const DATA_E_ORA = {
  pickerAppearance: 'dayAndTime',
  displayFormat: 'd MMM yyyy, HH:mm',
  timeIntervals: 30,
} as const

/**
 * Finestre di iscrizione: una per periodo (semestre per i corsi, sessione per gli esami),
 * aperte da segreteria, vicedirezione o admin. Il docente può prolungarle sul proprio corso.
 */
export const FinestreIscrizione: CollectionConfig = {
  slug: 'finestre-iscrizione',
  labels: { singular: 'Finestra di iscrizione', plural: 'Finestre di iscrizione' },
  typescript: { interface: 'FinestraIscrizione' },
  admin: {
    hidden: nascostaA('finestre-iscrizione'),
    useAsTitle: 'titolo',
    description:
      'Quando gli studenti possono iscriversi ai corsi di un semestre (e, in seguito, agli esami di una sessione).',
    defaultColumns: ['titolo', 'apertura', 'chiusura'],
    group: 'Didattica',
  },
  defaultSort: '-apertura',
  access: {
    read: () => true,
    create: soloGestioneIscrizioni,
    update: soloGestioneIscrizioni,
    delete: soloGestioneIscrizioni,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        // Il periodo deve essere coerente con il tipo (semestre per i corsi, sessione per gli esami)
        const ammessi = (data.tipo === 'esami' ? SESSIONI_ESAMI : PERIODI_CORSI).map(
          (p) => p.value as string,
        )
        if (data.periodo && !ammessi.includes(data.periodo)) data.periodo = undefined
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const d = { ...originalDoc, ...data }
        if (d.apertura && d.chiusura && new Date(d.chiusura) <= new Date(d.apertura)) {
          throw new APIError('La chiusura deve venire dopo l’apertura.', 400, null, true)
        }
        // Una sola finestra per tipo, anno e periodo
        const { totalDocs } = await req.payload.count({
          collection: 'finestre-iscrizione',
          req,
          where: {
            tipo: { equals: d.tipo },
            annoAccademico: { equals: d.annoAccademico },
            periodo: { equals: d.periodo },
            ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
          },
        })
        if (totalDocs > 0) {
          throw new APIError(
            'Esiste già una finestra per questo periodo: modifica quella.',
            400,
            null,
            true,
          )
        }
        data.titolo = `${TIPO_FINESTRA_LABELS[d.tipo as TipoFinestra]}, ${etichettaPeriodo(d.periodo).toLowerCase()} ${d.annoAccademico}`
        return data
      },
    ],
  },
  fields: [
    {
      name: 'titolo',
      type: 'text',
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tipo',
          label: 'Tipo',
          type: 'select',
          required: true,
          defaultValue: 'corsi',
          options: TIPI_FINESTRA.map((value) => ({ value, label: TIPO_FINESTRA_LABELS[value] })),
          admin: { width: '34%' },
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
          admin: { width: '33%' },
        },
        {
          name: 'periodo',
          label: 'Periodo',
          type: 'select',
          required: true,
          options: [...PERIODI_CORSI, ...SESSIONI_ESAMI].map((p) => ({ ...p })),
          admin: {
            width: '33%',
            description:
              'Semestre per i corsi, sessione per gli esami. I corsi annuali seguono il primo semestre.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'apertura',
          label: 'Apertura',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', date: DATA_E_ORA },
        },
        {
          name: 'chiusura',
          label: 'Chiusura',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: DATA_E_ORA,
            description:
              'Da qui gli studenti non si iscrivono e non annullano più. Il docente può prolungarla sul suo corso o appello; per gli esami chiude comunque il giorno prima dell’appello.',
          },
        },
      ],
    },
    {
      name: 'soloIscrittiAlCorso',
      label: 'Solo chi è iscritto al corso',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: (data) => data?.tipo === 'esami',
        description:
          'Se attivo, all’appello si iscrive solo chi risulta iscritto al corso. Per ora lascialo spento: le iscrizioni ai corsi partono con questa piattaforma.',
      },
    },
  ],
}
