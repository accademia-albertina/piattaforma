import type { Metadata, Viewport } from 'next'
import React from 'react'

import { LinkPdf, SiteFooter, SiteHeader, SkipLink, TornaSu } from '@/components'
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
        {/* Intestazione istituzionale: si vede solo in stampa (es. orario delle lezioni) */}
        <div className="intestazione-stampa" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-albertina.svg" alt="" width={166} height={76} />
          <p>
            Accademia Albertina di Belle Arti di Torino
            <br />
            Via Accademia Albertina 6, 10123 Torino · albertina.academy
          </p>
        </div>
        <SiteHeader servizi={menu.servizi} inEvidenza={menu.inEvidenza} colonne={menu.colonne} />
        <main id="contenuto" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter {...menu.footer} />
        <TornaSu />
        <LinkPdf />
      </body>
    </html>
  )
}
