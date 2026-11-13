import type { Access, CollectionConfig } from 'payload'

import { nascostaA } from '@/access/pannello'
import { isAdmin } from '@/access/roles'
import { GIORNI_REGISTRO_EMAIL } from '@/lib/registro-email'

const soloAdmin: Access = ({ req }) => isAdmin(req.user)

/**
 * Registro delle email in uscita (conferme di iscrizione, ecc.), solo in lettura e solo per gli
 * admin. Le voci si scrivono da src/lib/email.ts e si cancellano dopo 30 giorni.
 */
export const EmailInviate: CollectionConfig = {
  slug: 'email-inviate',
  labels: { singular: 'Email inviata', plural: 'Email inviate' },
  admin: {
    hidden: nascostaA('email-inviate'),
    group: 'Sistema',
    useAsTitle: 'oggetto',
    defaultColumns: ['createdAt', 'destinatario', 'oggetto', 'esito'],
    description: `Le email spedite dal sito negli ultimi ${GIORNI_REGISTRO_EMAIL} giorni, con l’esito. Le più vecchie si cancellano da sole.`,
    disableCopyToLocale: true,
  },
  defaultSort: '-createdAt',
  access: {
    read: soloAdmin,
    // Si scrive e si cancella solo dal codice (overrideAccess): nel pannello è un registro
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'destinatario', label: 'Destinatario', type: 'text', index: true },
    {
      name: 'consegnataA',
      label: 'Consegnata a',
      type: 'text',
      admin: {
        description:
          'Indirizzo a cui è partita davvero. In anteprima tutte le email vanno a un solo indirizzo di prova.',
      },
    },
    { name: 'oggetto', label: 'Oggetto', type: 'text' },
    {
      name: 'esito',
      label: 'Esito',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Inviata', value: 'inviata' },
        { label: 'Errore', value: 'errore' },
        { label: 'Non spedita (SMTP spento)', value: 'non-spedita' },
      ],
    },
    {
      name: 'errore',
      label: 'Errore',
      type: 'textarea',
      admin: { condition: (data) => data?.esito === 'errore' },
    },
    { name: 'testo', label: 'Testo', type: 'textarea' },
    {
      type: 'collapsible',
      label: 'Dettagli tecnici',
      admin: { initCollapsed: true },
      fields: [
        { name: 'idMessaggio', label: 'ID messaggio', type: 'text' },
        { name: 'risposta', label: 'Risposta del server SMTP', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
