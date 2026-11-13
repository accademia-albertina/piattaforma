import { filtroElenco, filtroPannello, nascostaA } from '@/access/pannello'
import { creatoDaField } from '@/fields/creatoDa'
import type { Access, CollectionConfig } from 'payload'

import { canAccessBackend } from '@/access/roles'
import { altDaNomeFile } from '@/utilities/testoAlternativo'

const backendUser: Access = ({ req }) => canAccessBackend(req.user)

/** Il docente modifica ed elimina solo i file che ha caricato lui; gli altri ruoli tutti. */
const modificaFile: Access = ({ req }) =>
  canAccessBackend(req.user) && (filtroPannello(req.user, 'media') ?? true)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'File', plural: 'File e immagini' },
  admin: {
    hidden: nascostaA('media'),
    baseFilter: filtroElenco('media'),
    group: 'Contenuti',
    description: 'Immagini e documenti usati in avvisi e pagine.',
  },
  access: {
    read: () => true,
    create: backendUser,
    update: modificaFile,
    delete: modificaFile,
  },
  fields: [
    creatoDaField(),
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
      ({ data, req, operation }) => {
        if (data.alt?.trim()) return data
        // Aggiornamenti senza file nuovo (es. l'ID Drive salvato dopo il caricamento): alt invariato
        if (operation === 'update' && !req.file && data.alt === undefined) return data
        data.alt = altDaNomeFile(req.file?.name ?? data.filename ?? '')
        return data
      },
    ],
  },
  upload: {
    // Sull'hosting i file vanno su un volume persistente (es. MEDIA_DIR=/data/media).
    ...(process.env.MEDIA_DIR ? { staticDir: process.env.MEDIA_DIR } : {}),
    // Solo immagini e PDF. Con Drive collegato i file vanno nella cartella Drive (src/lib/drive/).
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
      'application/pdf',
    ],
    // Ottimizzazione automatica: ogni foto diventa WebP con il lato lungo al massimo Full HD
    // (1920 px), mai ingrandita. Via anche i dati EXIF (posizione GPS, fotocamera).
    // PDF e SVG restano come sono.
    resizeOptions: { width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 80 } },
  },
}
