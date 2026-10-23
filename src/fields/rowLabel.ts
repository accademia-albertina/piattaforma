import type { ArrayField, Block } from 'payload'

/** Componente RowLabel per un array: etichetta la riga con il valore del campo indicato. */
export const rowLabel = (campo: string, fallback: string): NonNullable<ArrayField['admin']> => ({
  components: {
    RowLabel: { path: '/components/admin/RowLabel#RowLabel', clientProps: { campo, fallback } },
  },
})

/**
 * Intestazione di un blocco: tipo di blocco e riassunto del contenuto. Toglie il campo
 * “nome del blocco”, che nessuno compila e mostrava “Senza titolo”.
 */
export const etichettaBlocco = (tipo: string): NonNullable<Block['admin']> => ({
  disableBlockName: true,
  components: {
    Label: { path: '/components/admin/BlockLabel#BlockLabel', clientProps: { tipo } },
  },
})
