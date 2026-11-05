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
import { Trasparenza } from './collections/Trasparenza'
import { Scuole } from './collections/Scuole'
import { Pagine } from './collections/Pagine'
import { Albo } from './collections/Albo'
import { Calendari } from './collections/Calendari'
import { Corsi } from './collections/Corsi'
import { Docenti } from './collections/Docenti'
import { Navigazione } from './globals/Navigazione'
import { migrations } from './migrations'
import { seedCorsi } from './seed/corsi'
import { importaAvvisiWp } from './seed/avvisi-wp'
import { rimuoviDocenti } from './seed/docenti-rimossi'
import { importaDocentiWp } from './seed/docenti-wp'
import { importaAlboWp, importaTrasparenzaWp } from './seed/albo-trasparenza-wp'
import { aggiornaLinkCalendari } from './seed/link-calendari'
import { aggiornaLinkPagine } from './seed/link-pagine'
import { importaPagineWp } from './seed/pagine-wp'
import { correggiTitoliMaiuscoli } from './seed/titoli-maiuscoli'
import { importaCalendari } from './seed/calendari'
import { correggiFacciata, seedDemo } from './seed/demo'

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
      icons: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/brand/stemma-favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/brand/stemma-favicon-192.png' },
        { rel: 'apple-touch-icon', url: '/pannello/icona-180.png', sizes: '180x180' },
      ],
      // Web app su iPhone/Android: da Safari “Aggiungi alla schermata Home” si apre a schermo intero.
      manifest: '/pannello/manifest.webmanifest',
      appleWebApp: { capable: true, title: 'Albertina', statusBarStyle: 'default' },
    },
    // Date in formato italiano (Payload di default usa “ottobre 22 2026, 5:34 PM”).
    dateFormat: 'd MMMM yyyy, HH:mm',
    // Niente Gravatar: è un servizio esterno (privacy) e la CSP lo blocca.
    avatar: 'default',
    components: {
      providers: ['/components/admin/LinguaDate'],
      beforeLogin: ['/components/admin/PrimaDelLogin'],
      actions: ['/components/admin/ApriSito'],
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
        authentication: { login: 'Accedi' },
        version: { saveDraft: 'Salva bozza' },
      },
    },
  },
  collections: [Pagine, Avvisi, Corsi, Docenti, Calendari, Albo, Trasparenza, Scuole, Media, Users],
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
    if (process.env.SEED_DEMO !== 'true') return
    await seedDemo(payload)
    await seedCorsi(payload)
    await rimuoviDocenti(payload)
    await correggiFacciata(payload)
    await importaCalendari(payload)
    await aggiornaLinkCalendari(payload)
    await aggiornaLinkPagine(payload)
    void importaPagineWp(payload).catch((e) =>
      payload.logger.error(`Importazione pagine non riuscita: ${(e as Error).message}`),
    )
    // Gli avvisi del sito attuale sono più di mille: si importano in background,
    // senza ritardare l'avvio (l'hosting controlla /salute dopo pochi secondi).
    void importaAvvisiWp(payload).catch((e) =>
      payload.logger.error(`Importazione avvisi non riuscita: ${(e as Error).message}`),
    )
    void importaTrasparenzaWp(payload)
      .then(() => importaAlboWp(payload))
      // Dopo l'Albo (che ne ha molti): riscrive i titoli maiuscoli già salvati
      .then(() => correggiTitoliMaiuscoli(payload))
      .catch((e) =>
        payload.logger.error(
          `Importazione albo e trasparenza non riuscita: ${(e as Error).message}`,
        ),
      )
    void importaDocentiWp(payload).catch((e) =>
      payload.logger.error(`Importazione profili docenti non riuscita: ${(e as Error).message}`),
    )
  },
  plugins: [],
})
