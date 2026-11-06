import { filtroElenco, nascostaA } from '@/access/pannello'
import { erroreUtente } from '@/lib/errori'
import { endpointExport } from '@/lib/export-iscritti'
import { avvisaCorso } from '@/lib/email-iscrizioni'
import type { CollectionConfig } from 'payload'

import {
  annullaIscrizione,
  creaIscrizione,
  datiStudente,
  gestisceIscrizioni,
  leggiIscrizioni,
  soloGestioneIscrizioni,
} from '@/access/iscrizioni'
import { LIVELLI, LIVELLO_LABELS } from '@/access/corsi'
import { iscrizioniDelCorso } from '@/lib/iscrizioni'
import type { Corso, User } from '@/payload-types'

const rifiuta = (messaggio: string, status = 400) => {
  throw erroreUtente(messaggio, status)
}

const MESSAGGI_FINESTRA = {
  nessuna: 'Le iscrizioni a questo corso non sono ancora state programmate.',
  prima: 'Le iscrizioni a questo corso non sono ancora aperte.',
  chiusa: 'Le iscrizioni a questo corso sono chiuse.',
} as const

/**
 * Iscrizione di uno studente a un corso. Lo studente si iscrive dal sito (pagina del corso) entro
 * la finestra; il docente vede l'elenco nella scheda “Iscritti” del corso. Annullare = eliminare:
 * nel database restano solo le iscrizioni valide.
 */
export const IscrizioniCorsi: CollectionConfig = {
  slug: 'iscrizioni-corsi',
  labels: { singular: 'Iscrizione a un corso', plural: 'Iscrizioni ai corsi' },
  typescript: { interface: 'IscrizioneCorso' },
  admin: {
    hidden: nascostaA('iscrizioni-corsi'),
    baseFilter: filtroElenco('iscrizioni-corsi'),
    useAsTitle: 'nominativo',
    description:
      'Chi si è iscritto a quale corso. Gli studenti si iscrivono dalla pagina del corso.',
    defaultColumns: ['nominativo', 'matricola', 'livello', 'corso', 'createdAt'],
    group: 'Didattica',
    listSearchableFields: ['nominativo', 'email', 'matricola'],
  },
  defaultSort: 'nominativo',
  endpoints: [endpointExport('iscrizioni-corsi', 'corso')],
  access: {
    read: leggiIscrizioni,
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

        // Lo studente iscrive solo se stesso; gli uffici scelgono lo studente
        if (!ufficio) data.studente = user.id
        const studenteId =
          typeof data.studente === 'object' && data.studente ? data.studente.id : data.studente
        if (!studenteId) return rifiuta('Indica lo studente.')
        const studente =
          studenteId === user.id
            ? user
            : await req.payload.findByID({ collection: 'users', id: studenteId, req, depth: 0 })
        const dati = datiStudente(studente.email)
        if (!dati)
          return rifiuta('Solo gli account studente (12345t@ o 12345b@) si iscrivono ai corsi.')

        const corsoId = typeof data.corso === 'object' && data.corso ? data.corso.id : data.corso
        if (!corsoId) return rifiuta('Indica il corso.')
        const corso = (await req.payload
          .findByID({ collection: 'corsi', id: corsoId, req, depth: 0, draft: false })
          .catch(() => null)) as Corso | null
        if (!corso || corso._status !== 'published') return rifiuta('Corso non trovato.', 404)

        if (!ufficio) {
          if (!corso.livelli?.includes(dati.livello)) {
            return rifiuta(
              `Questo corso non è del ${LIVELLO_LABELS[dati.livello].toLowerCase()}: non puoi iscriverti.`,
            )
          }
          const { stato } = await iscrizioniDelCorso(req.payload, corso, req)
          if (stato !== 'aperta') return rifiuta(MESSAGGI_FINESTRA[stato])
        }

        const { totalDocs } = await req.payload.count({
          collection: 'iscrizioni-corsi',
          req,
          where: { studente: { equals: studenteId }, corso: { equals: corsoId } },
        })
        if (totalDocs > 0) return rifiuta('Risulta già un’iscrizione a questo corso.', 409)

        data.livello = dati.livello
        data.matricola = dati.matricola
        data.email = studente.email
        data.nominativo =
          [studente.cognome, studente.nome].filter(Boolean).join(' ') || studente.email
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') await avvisaCorso(req, doc, 'iscrizione')
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await avvisaCorso(req, doc, 'annullamento')
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Dopo la chiusura lo studente non annulla più: il docente ha l'elenco definitivo
        if (gestisceIscrizioni(req.user)) return
        const iscrizione = await req.payload.findByID({
          collection: 'iscrizioni-corsi',
          id,
          req,
          depth: 0,
        })
        const corso = (await req.payload.findByID({
          collection: 'corsi',
          id: iscrizione.corso as number,
          req,
          depth: 0,
          draft: false,
        })) as Corso
        const { stato } = await iscrizioniDelCorso(req.payload, corso, req)
        if (stato !== 'aperta') {
          rifiuta('Le iscrizioni sono chiuse: per annullare scrivi alla segreteria.')
        }
      },
    ],
  },
  fields: [
    {
      name: 'corso',
      label: 'Corso',
      type: 'relationship',
      relationTo: 'corsi',
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
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          admin: { readOnly: true, width: '20%' },
        },
      ],
    },
  ],
}
