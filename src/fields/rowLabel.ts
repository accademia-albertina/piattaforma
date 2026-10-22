import type { ArrayField } from 'payload'

/** Componente RowLabel per un array: etichetta la riga con il valore del campo indicato. */
export const rowLabel = (campo: string, fallback: string): NonNullable<ArrayField['admin']> => ({
  components: {
    RowLabel: { path: '/components/admin/RowLabel#RowLabel', clientProps: { campo, fallback } },
  },
})
