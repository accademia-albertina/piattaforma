import type { Access, CollectionConfig } from 'payload'

import { canAccessBackend } from '@/access/roles'
import { altDaNomeFile } from '@/utilities/testoAlternativo'

const backendUser: Access = ({ req }) => canAccessBackend(req.user)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'File', plural: 'File e immagini' },
  admin: {
    group: 'Contenuti',
    description: 'Immagini e documenti usati in avvisi e pagine.',
  },
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
      maxLength: 200,
      admin: {
        description:
          'Si scrive da solo al caricamento: descrive l’immagine per chi usa uno screen reader. Correggilo se serve.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      // Testo alternativo automatico, ricavato dal nome del file (sempre correggibile)
      ({ data, req }) => {
        if (data.alt?.trim()) return data
        data.alt = altDaNomeFile(req.file?.name ?? data.filename ?? '')
        return data
      },
    ],
  },
  upload: {
    // Sull'hosting i file vanno su un volume persistente (es. MEDIA_DIR=/data/media).
    ...(process.env.MEDIA_DIR ? { staticDir: process.env.MEDIA_DIR } : {}),
    // Solo immagini e PDF; il controllo antivirus arriva con l'integrazione Drive.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'application/pdf'],
    // Ottimizzazione automatica: ogni foto diventa WebP con il lato lungo al massimo Full HD
    // (1920 px), mai ingrandita. Via anche i dati EXIF (posizione GPS, fotocamera).
    // PDF e SVG restano come sono.
    resizeOptions: { width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 80 } },
  },
}
