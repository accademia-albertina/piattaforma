import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'

// CSP iniziale: 'unsafe-inline' sugli script serve a Next e al pannello Payload.
// Il passaggio a CSP con nonce è tracciato come lavoro successivo.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // Video delle scuole: solo YouTube senza cookie, caricato al clic (VideoYoutube)
  'frame-src https://www.youtube-nocookie.com',
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Con proxy.ts attivo Next taglia i corpi delle richieste a 10 MB e i caricamenti più grandi
    // finivano in errore. Il tetto vero è in Payload (src/lib/limiti-upload.ts, 50 MB per gli
    // admin): qui un po' di margine per l'intestazione multipart.
    proxyClientMaxBodySize: '52mb',
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // Indirizzi del sito attuale e dei vecchi menu che ora portano alla pagina dei calendari.
  async redirects() {
    return ['/didattica/orario-lezioni', '/didattica/calendari', '/orario-lezioni', '/calendario']
      .map((source) => ({ source, destination: '/calendari', permanent: true }))
      .concat(
        // Pagine del sito attuale spostate o con un indirizzo vecchio ancora linkato
        Object.entries({
          '/outgoing': '/erasmus/mobilita-studenti',
          '/incoming': '/erasmus/incoming-students',
          '/docenti-e-staff': '/erasmus/mobilita-docenti-staff',
          '/bandi-erasmus': '/erasmus/bandi',
          '/erasmus/bandi-erasmus': '/erasmus/bandi',
          '/studente/trasferimenti': '/didattica/trasferimenti',
          '/didattica/ammissioni-e-iscrizioni': '/didattica/ammissioni',
          '/didattica/segreteria': '/studente/segreteria-didattica',
          '/didattica/docenti': '/docenti',
          '/privacy': '/privacy-policy',
          '/cookie': '/cookie-policy',
          '/note-legali': '/termini-e-condizioni',
        }).map(([source, destination]) => ({ source, destination, permanent: true })),
      )
      // Il registro delle versioni ora sta nel pannello (solo con accesso)
      .concat([{ source: '/novita', destination: '/admin/changelog', permanent: false }])
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
