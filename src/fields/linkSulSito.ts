import type { UIField } from 'payload'

/**
 * Link "Vedi sul sito" nella colonna laterale del documento.
 * `prefisso` è l'inizio dell'indirizzo pubblico; `campo` il campo che lo completa.
 */
export const linkSulSito = (prefisso: string, campo = 'slug'): UIField => ({
  name: 'sulSito',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: {
        path: '/components/admin/LinkSulSito',
        clientProps: { prefisso, campo },
      },
    },
  },
})
