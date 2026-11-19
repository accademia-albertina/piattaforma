import { ICONE_SCUOLE } from '@/assets/icone-scuole'

/**
 * Slug della scuola a cui punta un link: pagina nuova (/scuole/pittura) o vecchio indirizzo
 * del sito WordPress (albertina-academy.it/scuola/pittura/), rimasto negli avvisi importati.
 * Serve a mettere l’icona della scuola accanto al nome ovunque se ne parli (Fede 2026-11-18).
 */
export function slugScuolaDaLink(url: string | null | undefined): string | null {
  if (!url) return null
  const m =
    /^(?:https?:\/\/(?:www\.)?albertina-academy\.it)?\/scuol[ae]\/([a-z0-9-]+)\/?(?:[?#].*)?$/i.exec(
      url.trim(),
    )
  const slug = m?.[1]?.toLowerCase()
  return slug && ICONE_SCUOLE[slug] ? slug : null
}
