import type { Access, CollectionConfig } from 'payload'

import { canAccessBackend } from '@/access/roles'

const backendUser: Access = ({ req }) => canAccessBackend(req.user)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  admin: { group: 'Contenuti' },
  access: {
    read: () => true,
    create: backendUser,
    update: backendUser,
    delete: backendUser,
  },
  fields: [
    {
      name: 'alt',
      label: 'Testo alternativo',
      type: 'text',
      required: true,
      admin: {
        description: 'Descrivi cosa mostra l’immagine per chi usa uno screen reader.',
      },
    },
  ],
  upload: {
    // Solo immagini e PDF; il controllo antivirus arriva con l'integrazione Drive.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'application/pdf'],
  },
}
