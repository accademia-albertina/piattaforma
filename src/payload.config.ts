import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { it } from '@payloadcms/translations/languages/it'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Avvisi } from './collections/Avvisi'
import { Scuole } from './collections/Scuole'
import { Pagine } from './collections/Pagine'
import { Navigazione } from './globals/Navigazione'
import { migrations } from './migrations'
import { seedDemo } from './seed/demo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (process.env.NODE_ENV === 'production' && !process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET mancante')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Accademia Albertina',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/stemma-albertina.svg' }],
    },
    // Date in formato italiano (Payload di default usa “ottobre 22 2026, 5:34 PM”).
    dateFormat: 'd MMMM yyyy, HH:mm',
    // Niente Gravatar: è un servizio esterno (privacy) e la CSP lo blocca.
    avatar: 'default',
    components: {
      graphics: {
        Logo: '/components/admin/Logo',
        Icon: '/components/admin/Icon',
      },
      views: {
        dashboard: { Component: '/components/admin/Dashboard' },
      },
    },
  },
  i18n: {
    supportedLanguages: { it },
    fallbackLanguage: 'it',
    // Correzioni alla traduzione italiana di Payload.
    translations: {
      it: {
        general: { edit: 'Modifica' },
        version: { saveDraft: 'Salva bozza' },
      },
    },
  },
  collections: [Pagine, Avvisi, Scuole, Media, Users],
  globals: [Navigazione],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  cors: process.env.NEXT_PUBLIC_SERVER_URL ? [process.env.NEXT_PUBLIC_SERVER_URL] : [],
  csrf: process.env.NEXT_PUBLIC_SERVER_URL ? [process.env.NEXT_PUBLIC_SERVER_URL] : [],
  graphQL: { disable: true },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // In sviluppo lo schema si allinea da solo; in produzione si applicano solo le migrazioni.
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
    // DATABASE_PUSH=false quando lo schema deve venire solo dalle migrazioni (es. test e2e).
    push: process.env.DATABASE_PUSH !== 'false',
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  // Anteprima online: al primo avvio carica i contenuti demo se il database è vuoto.
  onInit: async (payload) => {
    if (process.env.SEED_DEMO === 'true') await seedDemo(payload)
  },
  plugins: [],
})
