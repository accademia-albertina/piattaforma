'use client'

import { useEffect } from 'react'

const ID_AVVISO = 'avviso-nuova-scheda'

/** Un link porta a un PDF? (anche i file caricati, serviti da /api/media/file/…) */
export const isPdf = (href: string | null) => {
  if (!href) return false
  try {
    return new URL(href, 'https://x.invalid').pathname.toLowerCase().endsWith('.pdf')
  } catch {
    return false
  }
}

/** Apre il PDF in una nuova scheda e lo annuncia a chi usa un lettore di schermo. */
export function marcaLinkPdf(radice: ParentNode) {
  radice.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    if (a.hasAttribute('download') || a.target || !isPdf(a.getAttribute('href'))) return
    a.target = '_blank'
    a.rel = 'noopener'
    const descritto = a.getAttribute('aria-describedby')
    if (!descritto?.includes(ID_AVVISO)) {
      a.setAttribute('aria-describedby', [descritto, ID_AVVISO].filter(Boolean).join(' '))
    }
  })
}

/**
 * Tutti i link a PDF del sito si aprono in una nuova scheda (Fede 2026-11-13), in attesa
 * del visualizzatore. Vale anche per i link scritti nei testi del pannello.
 */
export function LinkPdf() {
  useEffect(() => {
    marcaLinkPdf(document)
    const osservatore = new MutationObserver(() => marcaLinkPdf(document))
    osservatore.observe(document.body, { childList: true, subtree: true })
    return () => osservatore.disconnect()
  }, [])

  return (
    <span id={ID_AVVISO} hidden>
      (si apre in una nuova scheda)
    </span>
  )
}
