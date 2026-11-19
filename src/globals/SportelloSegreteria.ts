import { revalidatePath } from 'next/cache'
import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { nascostaA } from '@/access/pannello'
import { gestisceSportello } from '@/access/sportello'
import { rowLabel } from '@/fields/rowLabel'
import { GIORNI_SETTIMANA, ORA_VALIDA } from '@/lib/sportello-orari'

const ora: TextFieldSingleValidation = (v) =>
  !v || ORA_VALIDA.test(v) ? true : 'Scrivi l’ora come 10:00 o 14:30.'

const campoOra = (name: 'dalle' | 'alle', label: string) => ({
  name,
  label,
  type: 'text' as const,
  required: true,
  validate: ora,
  admin: { width: '25%', placeholder: name === 'dalle' ? '10:00' : '12:00' },
})

const giorno = { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } as const

/** Documenti e regole presi da Amelia sul sito attuale (novembre 2026). */
export const DOCUMENTI_PREDEFINITI = [
  'Libretto',
  'Pergamena di laurea',
  'Certificato sostitutivo di diploma',
  'Iscrizione e voti per permesso di soggiorno',
  'Attestato 24 CFA',
  'Convenzione di stage',
]

const CHIUSURE_AMELIA = [
  '2026-12-28',
  '2027-01-01',
  '2027-01-04',
  '2027-01-08',
  '2027-03-01',
  '2027-03-05',
  '2027-03-29',
  '2027-06-28',
  '2027-07-02',
  '2027-10-04',
  '2027-10-08',
  '2027-11-01',
  '2027-12-31',
]

/**
 * Orari, turni e documenti dello sportello della segreteria didattica. Li modifica la
 * segreteria; il sito calcola da qui i turni prenotabili.
 */
export const SportelloSegreteria: GlobalConfig = {
  slug: 'sportello-segreteria',
  label: 'Orari e documenti dello sportello',
  admin: {
    hidden: nascostaA('sportello-segreteria'),
    group: 'Sportello della segreteria',
    description:
      'Giorni, orari e durata dei turni, documenti che si possono prenotare e giorni di chiusura. Le modifiche valgono subito sul sito; le prenotazioni già fatte restano.',
  },
  access: {
    read: () => true,
    update: ({ req }) => gestisceSportello(req.user),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Chiusure appena aggiunte: annulla le prenotazioni in quei turni e avvisa
        const { annullaPerChiusure } = await import('@/collections/PrenotazioniSegreteria')
        await annullaPerChiusure(req)
        try {
          revalidatePath('/prenotazioni-segreteria')
        } catch {
          // Fuori da Next (script, test) non c'è nulla da rigenerare.
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'attivo',
      label: 'Prenotazioni aperte sul sito',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Togli la spunta per sospendere le nuove prenotazioni (restano quelle fatte).',
      },
    },
    {
      name: 'avviso',
      label: 'Avviso sopra il modulo',
      type: 'textarea',
      defaultValue:
        'I documenti si ritirano in segreteria didattica il giorno dell’appuntamento. Prenota tenendo conto della scadenza per cui ti serve il documento.',
      admin: { description: 'Facoltativo. Lo vede chi prenota, sopra la scelta del documento.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Orari',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'durataTurno',
                  label: 'Durata di un turno (minuti)',
                  type: 'number',
                  required: true,
                  min: 1,
                  max: 120,
                  defaultValue: 5,
                  admin: { width: '33%' },
                },
                {
                  name: 'personePerTurno',
                  label: 'Persone per turno',
                  type: 'number',
                  required: true,
                  min: 1,
                  max: 20,
                  defaultValue: 1,
                  admin: { width: '33%' },
                },
                {
                  name: 'giorniPrenotabili',
                  label: 'Si prenota fino a (giorni)',
                  type: 'number',
                  required: true,
                  min: 1,
                  max: 180,
                  defaultValue: 60,
                  admin: {
                    width: '33%',
                    description: 'Quanti giorni avanti si vede il calendario.',
                  },
                },
              ],
            },
            {
              name: 'orari',
              label: 'Orario settimanale',
              labels: { singular: 'Fascia oraria', plural: 'Fasce orarie' },
              type: 'array',
              defaultValue: [
                { giorno: '1', dalle: '10:00', alle: '12:00' },
                { giorno: '5', dalle: '10:00', alle: '12:00' },
              ],
              admin: {
                description:
                  'Una riga per ogni giorno di apertura (anche due righe per lo stesso giorno, es. mattina e pomeriggio).',
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '/components/admin/EtichettaSportello#EtichettaSportello',
                    clientProps: { tipo: 'orario' },
                  },
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'giorno',
                      label: 'Giorno',
                      type: 'select',
                      required: true,
                      options: GIORNI_SETTIMANA.map((g) => ({ ...g })),
                      admin: { width: '50%' },
                    },
                    campoOra('dalle', 'Dalle'),
                    campoOra('alle', 'Alle'),
                  ],
                },
              ],
            },
            {
              name: 'aperture',
              label: 'Aperture in più',
              labels: { singular: 'Apertura in più', plural: 'Aperture in più' },
              type: 'array',
              admin: {
                description:
                  'Giorni straordinari, per esempio quando i turni normali sono tutti pieni.',
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '/components/admin/EtichettaSportello#EtichettaSportello',
                    clientProps: { tipo: 'apertura' },
                  },
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'data',
                      label: 'Giorno',
                      type: 'date',
                      required: true,
                      admin: { width: '50%', date: giorno },
                    },
                    campoOra('dalle', 'Dalle'),
                    campoOra('alle', 'Alle'),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Chiusure',
          fields: [
            {
              name: 'chiusure',
              label: 'Giorni di chiusura',
              labels: { singular: 'Chiusura', plural: 'Chiusure' },
              type: 'array',
              defaultValue: CHIUSURE_AMELIA.map((dal) => ({
                dal: `${dal}T12:00:00.000Z`,
                motivo: 'Chiusura',
              })),
              admin: {
                description:
                  'Nessuno può prenotare in questi giorni. Le festività nazionali e San Giovanni (24 giugno) sono già escluse. Per un solo giorno lascia vuoto “Fino al”; per chiudere solo alcune ore compila “Dalle ore” e “Alle ore”. Quando salvi, le prenotazioni già fatte in quei turni vengono annullate e chi aveva prenotato riceve un’email.',
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '/components/admin/EtichettaSportello#EtichettaSportello',
                    clientProps: { tipo: 'chiusura' },
                  },
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'dal',
                      label: 'Dal',
                      type: 'date',
                      required: true,
                      admin: { width: '25%', date: giorno },
                    },
                    {
                      name: 'al',
                      label: 'Fino al',
                      type: 'date',
                      admin: { width: '25%', date: giorno },
                    },
                    { ...campoOra('dalle', 'Dalle ore'), required: false },
                    { ...campoOra('alle', 'Alle ore'), required: false },
                  ],
                },
                {
                  name: 'motivo',
                  label: 'Motivo',
                  type: 'text',
                  admin: {
                    description:
                      'Facoltativo. Compare nell’email a chi aveva già prenotato, es. “Chiusura straordinaria per sciopero”.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Documenti',
          fields: [
            {
              name: 'documenti',
              label: 'Documenti da ritirare',
              labels: { singular: 'Documento', plural: 'Documenti' },
              type: 'array',
              minRows: 1,
              defaultValue: DOCUMENTI_PREDEFINITI.map((nome) => ({ nome, attivo: true })),
              admin: {
                description:
                  'Cosa si può prenotare, nell’ordine in cui compare sul sito. Togli “Prenotabile” invece di eliminare un documento.',
                initCollapsed: true,
                ...rowLabel('nome', 'Documento'),
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
                      admin: { width: '70%' },
                    },
                    {
                      name: 'attivo',
                      label: 'Prenotabile',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '30%', style: { alignSelf: 'center' } },
                    },
                  ],
                },
                {
                  name: 'descrizione',
                  label: 'Nota per chi prenota',
                  type: 'textarea',
                  admin: { description: 'Facoltativa, es. cosa portare.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
