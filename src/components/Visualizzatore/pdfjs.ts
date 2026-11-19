import type * as Pdfjs from 'pdfjs-dist'

/**
 * PDF.js si carica solo quando serve (primo PDF aperto): la libreria pesa circa 400 KB e il
 * worker, che legge il PDF in un thread a parte, ancora di più. Tutto gira nel browser:
 * il server consegna solo il file, nessuna elaborazione lato server (Render da 512 MB).
 * Worker, font e CMap sono in public/pdfjs/<versione>/ (scripts/pdfjs-risorse.mjs).
 */
let caricamento: Promise<typeof Pdfjs> | null = null

export function caricaPdfjs(): Promise<typeof Pdfjs> {
  caricamento ??= import('pdfjs-dist')
    .then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `${risorse(pdfjs.version)}pdf.worker.min.mjs`
      return pdfjs
    })
    .catch((err) => {
      // Un errore di rete non deve bloccare i tentativi successivi
      caricamento = null
      throw err
    })
  return caricamento
}

function risorse(versione: string) {
  return `/pdfjs/${versione}/`
}

/** Apre il PDF: restituisce il task, da distruggere quando il visualizzatore si chiude. */
export async function apriPdf(
  url: string,
  onProgresso?: (frazione: number | null) => void,
): Promise<Pdfjs.PDFDocumentLoadingTask> {
  const pdfjs = await caricaPdfjs()
  const base = risorse(pdfjs.version)
  const task = pdfjs.getDocument({
    url,
    cMapUrl: `${base}cmaps/`,
    standardFontDataUrl: `${base}standard_fonts/`,
    wasmUrl: `${base}wasm/`,
    iccUrl: `${base}iccs/`,
    enableXfa: false,
  })
  if (onProgresso) {
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) =>
      onProgresso(total > 0 ? Math.min(1, loaded / total) : null)
  }
  return task
}

/** 1 punto PDF = 1/72 di pollice; 1 px CSS = 1/96: a zoom 100% la pagina ha la sua misura reale. */
export const PDF_IN_CSS = 96 / 72
