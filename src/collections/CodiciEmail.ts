import type { CollectionConfig } from 'payload'

/**
 * Codici di 6 cifre spediti a chi prenota in segreteria senza account istituzionale.
 * Solo l'impronta del codice, mai il codice. Nessun accesso dalle API: li usa solo il server.
 */
export const CodiciEmail: CollectionConfig = {
  slug: 'codici-email',
  labels: { singular: 'Codice email', plural: 'Codici email' },
  admin: { hidden: true },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'impronta', type: 'text', required: true },
    { name: 'scadenza', type: 'date', required: true },
    { name: 'tentativi', type: 'number', defaultValue: 0 },
    { name: 'usato', type: 'checkbox', defaultValue: false },
  ],
}
