/**
 * Link ai file. PDF e immagini del sito si aprono nel visualizzatore (componente
 * Visualizzatore, montato nel layout del sito), che intercetta il clic sui link con
 * `data-anteprima`. Senza JavaScript, o con Ctrl/Cmd+clic, il link resta un link normale.
 * I PDF di altri siti si aprono in una nuova scheda (Fede 2026-11-13); gli altri file
 * (DOCX, ZIP…) restano scaricabili come prima.
 */
export function isPdf(url: string | null | undefined, mimeType?: string | null): boolean {
  if (mimeType) return mimeType === 'application/pdf'
  return Boolean(url && /\.pdf(?:[?#]|$)/i.test(url))
}

const ESTENSIONI_IMMAGINE = /\.(?:jpe?g|png|webp|gif|avif|svg)(?:[?#]|$)/i

export function isImmagine(url: string | null | undefined, mimeType?: string | null): boolean {
  if (mimeType) return mimeType.startsWith('image/')
  return Boolean(url && ESTENSIONI_IMMAGINE.test(url))
}

/**
 * Il file è servito dal sito stesso? Il visualizzatore legge il PDF con fetch: i file di
 * altri siti non si possono leggere (CORS e CSP), quindi per quelli resta il link.
 */
export function fileDelSito(url: string): boolean {
  if (url.startsWith('/')) return !url.startsWith('//')
  const sito = process.env.NEXT_PUBLIC_SERVER_URL
  if (!sito) return false
  try {
    return new URL(url).origin === new URL(sito).origin
  } catch {
    return false
  }
}

export type TipoAnteprima = 'pdf' | 'immagine'

/** Che cosa mostra il visualizzatore per questo file, o null se il file si apre come link. */
export function tipoAnteprima(
  url: string | null | undefined,
  mimeType?: string | null,
): TipoAnteprima | null {
  if (!url || !fileDelSito(url)) return null
  if (isPdf(url, mimeType)) return 'pdf'
  if (isImmagine(url, mimeType)) return 'immagine'
  return null
}

export type AttributiFile = {
  target?: '_blank'
  rel?: string
  download?: true
  'aria-haspopup'?: 'dialog'
  'data-anteprima'?: TipoAnteprima
  'data-titolo'?: string
  'data-file'?: string
  'data-info'?: string
}

/**
 * Attributi del link a un file: anteprima nel visualizzatore per PDF e immagini del sito,
 * nuova scheda per i PDF esterni, `download` per gli altri file se richiesto.
 * `titolo`, `filename` e `info` (es. «PDF · 1,2 MB») compaiono nella barra del visualizzatore.
 */
export function attributiFile(
  url: string,
  {
    mimeType,
    scarica = false,
    titolo,
    filename,
    info,
  }: {
    mimeType?: string | null
    scarica?: boolean
    titolo?: string | null
    filename?: string | null
    info?: string | null
  } = {},
): AttributiFile {
  const tipo = tipoAnteprima(url, mimeType)
  if (tipo) {
    return {
      'aria-haspopup': 'dialog',
      'data-anteprima': tipo,
      ...(titolo ? { 'data-titolo': titolo } : {}),
      ...(filename ? { 'data-file': filename } : {}),
      ...(info ? { 'data-info': info } : {}),
    }
  }
  if (isPdf(url, mimeType)) return { target: '_blank', rel: 'noopener' }
  return scarica ? { download: true } : {}
}

/** Il link apre una nuova scheda? Serve per avvisare chi usa un lettore di schermo. */
export function apreNuovaScheda(url: string, mimeType?: string | null): boolean {
  return isPdf(url, mimeType) && !tipoAnteprima(url, mimeType)
}

/** Testo per i lettori di schermo da aggiungere ai link che aprono una nuova scheda. */
export const NUOVA_SCHEDA = ' (si apre in una nuova scheda)'
