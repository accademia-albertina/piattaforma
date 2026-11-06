import { filtroElenco, nascostaA } from '@/access/pannello'
import { APIError, type CollectionConfig } from 'payload'

import { LIVELLI, LIVELLO_LABELS } from '@/access/corsi'
import {
  annullaIscrizione,
  creaIscrizione,
  datiStudente,
  gestisceIscrizioni,
  leggiIscrizioniEsami,
  soloGestioneIscrizioni,
} from '@/access/iscrizioni'
import { iscrizioniDellAppello } from '@/lib/iscrizioni'
import type { Appello, User } from '@/payload-types'

const rifiuta = (messaggio: string, status = 400): never => {
  throw new APIError(messaggio, status, null, true)
}

const MESSAGGI_FINESTRA = {
  nessuna: 'Le iscrizioni a questa sessione d’esami non sono ancora state programmate.',
  prima: 'Le iscrizioni a questo appello non sono ancora aperte.',
  chiusa: 'Le iscrizioni a questo appello sono chiuse.',
} as const

const idDi = (v: unknown) =>
  (typeof v === 'object' && v ? (v as { id: number }).id : v) as number | undefined

/**
 * Iscrizione di uno studente a un appello. Stesse regole dei corsi: si iscrive dal sito nella
 * finestra della sessione (che chiude comunque il giorno dell'esame), annulla finché è aperta,
 * il docente vede sempre gli iscritti. Un solo appello per corso nella stessa sessione.
 */
export const IscrizioniEsami: CollectionConfig = {
  slug: 'iscrizioni-esami',
  labels: { singular: 'Iscrizione a un esame', plural: 'Iscrizioni agli esami' },
  typescript: { interface: 'IscrizioneEsame' },
  admin: {
    hidden: nascostaA('iscrizioni-esami'),
    baseFilter: filtroElenco('iscrizioni-esami'),
    useAsTitle: 'nominativo',
    description: 'Chi si è iscritto a quale appello. Gli studenti si iscrivono dal sito.',
    defaultColumns: ['nominativo', 'matricola', 'livello', 'appello', 'createdAt'],
    group: 'Didattica',
    listSearchableFields: ['nominativo', 'email', 'matricola'],
  },
  defaultSort: 'nominativo',
  access: {
    read: leggiIscrizioniEsami,
    create: creaIscrizione,
    update: soloGestioneIscrizioni,
    delete: annullaIscrizione,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const user = req.user as User | null
        if (!user) return rifiuta('Accedi per iscriverti.', 401)
        const ufficio = gestisceIscrizioni(user)

        if (!ufficio) data.studente = user.id
        const studenteId = idDi(data.studente)
        if (!studenteId) return rifiuta('Indica lo studente.')
        const studente =
          studenteId === user.id
            ? user
            : await req.payload.findByID({ collection: 'users', id: studenteId, req, depth: 0 })
        const dati = datiStudente(studente.email)
        if (!dati)
          return rifiuta('Solo gli account studente (12345t@ o 12345b@) si iscrivono agli esami.')

        const appelloId = idDi(data.appello)
        if (!appelloId) return rifiuta('Indica l’appello.')
        const appello = (await req.payload
          .findByID({ collection: 'appelli', id: appelloId, req, depth: 0 })
          .catch(() => null)) as Appello | null
        if (!appello) return rifiuta('Appello non trovato.', 404)
        const corsoId = idDi(appello.corso)!

        if (!ufficio) {
          if (!appello.livelli?.includes(dati.livello)) {
            return rifiuta(
              `Questo appello non è per il ${LIVELLO_LABELS[dati.livello].toLowerCase()}: scegli quello del tuo livello.`,
            )
          }
          const finestra = await iscrizioniDellAppello(req.payload, appello, req)
          if (finestra.stato !== 'aperta') return rifiuta(MESSAGGI_FINESTRA[finestra.stato])
          if (finestra.soloIscrittiAlCorso) {
            const { totalDocs } = await req.payload.count({
              collection: 'iscrizioni-corsi',
              req,
              where: { studente: { equals: studenteId }, corso: { equals: corsoId } },
            })
            if (!totalDocs)
              return rifiuta('Per iscriverti all’esame devi essere iscritto al corso.')
          }
        }

        // Un solo appello dello stesso corso nella stessa sessione
        const { totalDocs } = await req.payload.count({
          collection: 'iscrizioni-esami',
          req,
          where: {
            studente: { equals: studenteId },
            corso: { equals: corsoId },
            annoAccademico: { equals: appello.annoAccademico },
            sessione: { equals: appello.sessione },
          },
        })
        if (totalDocs > 0) {
          return rifiuta(
            'Risulta già un’iscrizione a un appello di questo corso nella stessa sessione: annullala prima di sceglierne un altro.',
            409,
          )
        }

        data.corso = corsoId
        data.annoAccademico = appello.annoAccademico
        data.sessione = appello.sessione
        data.livello = dati.livello
        data.matricola = dati.matricola
        data.email = studente.email
        data.nominativo =
          [studente.cognome, studente.nome].filter(Boolean).join(' ') || studente.email
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        if (gestisceIscrizioni(req.user)) return
        const iscrizione = await req.payload.findByID({
          collection: 'iscrizioni-esami',
          id,
          req,
          depth: 0,
        })
        const appello = await req.payload.findByID({
          collection: 'appelli',
          id: idDi(iscrizione.appello)!,
          req,
          depth: 0,
        })
        const { stato } = await iscrizioniDellAppello(req.payload, appello, req)
        if (stato !== 'aperta') {
          rifiuta('Le iscrizioni sono chiuse: per annullare scrivi alla segreteria.')
        }
      },
    ],
  },
  fields: [
    {
      name: 'appello',
      label: 'Appello',
      type: 'relationship',
      relationTo: 'appelli',
      required: true,
      index: true,
    },
    {
      name: 'studente',
      label: 'Account dello studente',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { description: 'Lo sceglie la segreteria solo per un’iscrizione aggiunta a mano.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nominativo',
          label: 'Cognome e nome',
          type: 'text',
          admin: { readOnly: true, width: '40%' },
        },
        {
          name: 'matricola',
          label: 'Matricola',
          type: 'text',
          admin: { readOnly: true, width: '20%' },
        },
        {
          name: 'livello',
          label: 'Livello',
          type: 'select',
          options: LIVELLI.map((value) => ({ value, label: LIVELLO_LABELS[value] })),
          admin: { readOnly: true, width: '20%' },
        },
        { name: 'email', label: 'Email', type: 'email', admin: { readOnly: true, width: '20%' } },
      ],
    },
    // Copiati dall'appello per controllare i doppioni nella stessa sessione
    {
      name: 'corso',
      type: 'relationship',
      relationTo: 'corsi',
      index: true,
      admin: { hidden: true },
    },
    { name: 'annoAccademico', type: 'text', admin: { hidden: true } },
    { name: 'sessione', type: 'text', admin: { hidden: true } },
  ],
}
