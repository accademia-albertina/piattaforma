import type { CollectionBeforeChangeHook, Field } from 'payload'

import { isAdmin } from '@/access/roles'

/**
 * Provenienza dal sito WordPress di avvisi, atti dell'Albo e sottosezioni della Trasparenza.
 * Serve alla sincronizzazione (src/lib/wp-import/contenuti/): riconosce i contenuti già
 * importati, prende solo quelli nuovi o modificati su WordPress e non tocca quelli che
 * qualcuno ha modificato nel pannello.
 */
export const campiProvenienzaWp: Field = {
  type: 'collapsible',
  label: 'Importato dal sito attuale',
  admin: {
    position: 'sidebar',
    initCollapsed: true,
    condition: (data) => Boolean(data?.wpId),
  },
  fields: [
    {
      name: 'wpId',
      label: 'ID WordPress',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, disableBulkEdit: true },
    },
    {
      name: 'wpModificato',
      label: 'Ultima modifica su WordPress',
      type: 'text',
      admin: { readOnly: true, disableBulkEdit: true },
    },
    {
      // Versione della conversione + data di modifica (o impronta del contenuto) su WordPress
      name: 'wpImpronta',
      type: 'text',
      admin: { hidden: true, disableBulkEdit: true },
    },
    {
      name: 'modificatoNelPannello',
      label: 'Modificato nel pannello',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        disableBulkEdit: true,
        description:
          'La sincronizzazione da WordPress non sovrascrive questo contenuto. Togli la spunta e salva per riallinearlo alla versione di WordPress.',
      },
    },
  ],
}

/**
 * Chi salva dal pannello un contenuto importato lo "prende in carico": da lì in poi la
 * sincronizzazione non lo sovrascrive. Togliere la spunta (solo admin) lo riallinea alla
 * prossima sincronizzazione. Le operazioni del server (importazione, riscrittura dei link,
 * correzioni all'avvio) passano `context.importazione` e non contano.
 */
export const segnaModificaNelPannello: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  context,
  req,
}) => {
  if (context?.importazione) return data
  // I campi della provenienza li scrive solo la sincronizzazione (niente access sui campi:
  // l'access di campo annullerebbe anche i valori impostati qui).
  data.wpId = originalDoc?.wpId ?? null
  data.wpModificato = originalDoc?.wpModificato ?? null
  data.wpImpronta = originalDoc?.wpImpronta ?? null
  if (operation !== 'update' || !originalDoc?.wpId) {
    data.modificatoNelPannello = false
    return data
  }
  if (
    originalDoc.modificatoNelPannello &&
    data.modificatoNelPannello === false &&
    isAdmin(req.user)
  ) {
    // Spunta tolta da un admin: alla prossima sincronizzazione torna la versione di WordPress
    data.wpImpronta = null
    return data
  }
  data.modificatoNelPannello = true
  return data
}
