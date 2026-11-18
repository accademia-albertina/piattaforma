import type { GlobalConfig } from 'payload'

/**
 * Esito dell'ultima sincronizzazione dei contenuti da WordPress, salvato perché la pagina
 * /admin/integrazioni lo mostri anche dopo un riavvio del server. Lo scrive e lo legge solo il server
 * (overrideAccess); nascosto dal menu del pannello.
 */
export const EsitiImportazione: GlobalConfig = {
  slug: 'esiti-importazione',
  label: 'Esiti importazione',
  admin: { hidden: true },
  access: { read: () => false, update: () => false },
  fields: [{ name: 'contenuti', type: 'json' }],
}
