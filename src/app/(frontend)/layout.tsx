import type { Metadata, Viewport } from 'next'
import React from 'react'

import { SiteFooter, SiteHeader, SkipLink } from '@/components'
import { menuSito } from '@/lib/menu'
import '@/styles/global.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Accademia Albertina di Belle Arti di Torino',
    template: '%s · Accademia Albertina',
  },
  description: 'Sito istituzionale dell’Accademia Albertina di Belle Arti di Torino.',
}

export const viewport: Viewport = {
  themeColor: '#a23130',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const menu = await menuSito()
  return (
    <html lang="it">
      <head>
        <link
          rel="preload"
          href="/fonts/albert-sans-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SkipLink />
        <SiteHeader servizi={menu.servizi} inEvidenza={menu.inEvidenza} colonne={menu.colonne} />
        <main id="contenuto" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter {...menu.footer} />
      </body>
    </html>
  )
}
