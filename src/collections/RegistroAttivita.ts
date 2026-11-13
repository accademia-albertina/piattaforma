import type { CollectionConfig } from 'payload'

import { nascostaA } from '@/access/pannello'
import { isAdmin } from '@/access/roles'
import { AZIONI_REGISTRO, ETICHETTE_AZIONE, SLUG_REGISTRO } from '@/lib/registro/costanti'

/**
 * Registro attività del pannello: chi ha creato, modificato, pubblicato o eliminato cosa.
 * Le voci le scrive solo il server (src/lib/registro); nessuno, nemmeno l'admin, può
 * crearle, modificarle o cancellarle dal pannello o dall'API. Lo leggono solo gli admin.
 */
export const RegistroAttivita: CollectionConfig = {
  slug: SLUG_REGISTRO,
  labels: { singular: 'Attività', plural: 'Registro attività' },
  typescript: { interface: 'VoceRegistro' },
  admin: {
    hidden: nascostaA('registro-attivita'),
    useAsTitle: 'riepilogo',
    description:
      'Chi ha creato, modificato, pubblicato o eliminato cosa nel pannello. Le voci si cancellano da sole dopo un anno.',
    defaultColumns: ['createdAt', 'utenteNome', 'azione', 'sezione', 'titolo', 'campi'],
    listSearchableFields: ['titolo', 'utenteNome', 'utenteEmail'],
    group: 'Sistema',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  timestamps: true,
  fields: [
    {
      name: 'apri',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/ApriElementoRegistro' },
      },
    },
    // Ridefinito solo per l'etichetta della colonna ("Creato il" non dice nulla qui)
    { name: 'createdAt', label: 'Quando', type: 'date', index: true, admin: { hidden: true } },
    {
      name: 'azione',
      label: 'Azione',
      type: 'select',
      required: true,
      index: true,
      options: AZIONI_REGISTRO.map((value) => ({ value, label: ETICHETTE_AZIONE[value] })),
      admin: { readOnly: true },
    },
    {
      name: 'utente',
      label: 'Account',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { readOnly: true },
    },
    // Nome ed email copiati: restano leggibili anche se l'account viene poi cancellato.
    { name: 'utenteNome', label: 'Chi', type: 'text', admin: { readOnly: true } },
    { name: 'utenteEmail', label: 'Email', type: 'text', admin: { readOnly: true } },
    {
      name: 'collezione',
      label: 'Collezione',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true, description: 'Nome tecnico (es. avvisi).' },
    },
    { name: 'sezione', label: 'Sezione', type: 'text', admin: { readOnly: true } },
    { name: 'documentoId', label: 'ID', type: 'text', index: true, admin: { readOnly: true } },
    { name: 'titolo', label: 'Elemento', type: 'text', admin: { readOnly: true } },
    {
      name: 'campi',
      label: 'Campi cambiati',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Solo i nomi dei campi, non i valori. “—” per creazioni ed eliminazioni.',
      },
    },
    { name: 'riepilogo', label: 'Riepilogo', type: 'text', admin: { readOnly: true } },
  ],
}
