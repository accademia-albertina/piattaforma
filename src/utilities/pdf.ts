/**
 * I PDF si aprono in una nuova scheda (Fede 2026-11-13), in attesa del visualizzatore nel sito.
 * Gli altri file (DOCX, ZIP…) restano scaricabili come prima.
 */
export function isPdf(url: string | null | undefined, mimeType?: string | null): boolean {
  if (mimeType) return mimeType === 'application/pdf'
  return Boolean(url && /\.pdf(?:[?#]|$)/i.test(url))
}

/** Attributi del link: nuova scheda per i PDF, `download` per gli altri file se richiesto. */
export function attributiFile(
  url: string,
  { mimeType, scarica = false }: { mimeType?: string | null; scarica?: boolean } = {},
): { target?: '_blank'; rel?: string; download?: true } {
  if (isPdf(url, mimeType)) return { target: '_blank', rel: 'noopener' }
  return scarica ? { download: true } : {}
}

/** Testo per i lettori di schermo da aggiungere ai link che aprono una nuova scheda. */
export const NUOVA_SCHEDA = ' (si apre in una nuova scheda)'
