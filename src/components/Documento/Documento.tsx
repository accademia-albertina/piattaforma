import { Download, ExternalLink, Maximize2 } from 'lucide-react'

import { formatDimensione, formatTipoFile } from '@/utilities/format'
import { NUOVA_SCHEDA, attributiFile, isPdf, tipoAnteprima } from '@/utilities/pdf'

import { AnteprimaPdf } from '../Visualizzatore/AnteprimaPdf'

import styles from './Documento.module.css'

export type DocumentoProps = {
  /** Titolo del documento, es. “Regolamento tasse 2026-27”. */
  nome: string
  url: string
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  /** Testo breve sotto il titolo. */
  descrizione?: string | null
  /** Anteprima del PDF nella pagina (no quando il testo è già nella pagina). */
  anteprima?: boolean | null
  /** Id del titolo (da cambiare se nella pagina ci sono più documenti). */
  id: string
}

/**
 * Documento in evidenza nella pagina (es. il regolamento delle tasse): titolo, formato e peso,
 * pulsanti per aprirlo e scaricarlo e l'anteprima del PDF incorporata (visualizzatore del
 * sito, PDF.js nel browser: funziona anche sul telefono). «Apri» porta il PDF a schermo intero;
 * i PDF di altri siti si aprono in una nuova scheda e non hanno anteprima.
 */
export function Documento({
  nome,
  url,
  filename,
  mimeType,
  filesize,
  descrizione,
  anteprima = true,
  id,
}: DocumentoProps) {
  const pdf = isPdf(url, mimeType)
  const nelSito = tipoAnteprima(url, mimeType) === 'pdf'
  const info = [formatTipoFile(mimeType, filename), formatDimensione(filesize)].filter(Boolean)
  return (
    <section className={styles.documento} aria-labelledby={id}>
      <div className={styles.intestazione}>
        <div>
          <h2 id={id} className={styles.nome}>
            {nome}
          </h2>
          {descrizione ? <p className={styles.descrizione}>{descrizione}</p> : null}
          {info.length ? <p className={styles.info}>{info.join(' · ')}</p> : null}
        </div>
        <div className={styles.azioni}>
          {nelSito ? (
            <a
              className={styles.azione}
              href={url}
              {...attributiFile(url, {
                mimeType,
                titolo: nome,
                filename,
                info: info.join(' · '),
              })}
            >
              <Maximize2 size={18} strokeWidth={1.75} aria-hidden />
              Apri <span className="visually-hidden">{nome}</span>
            </a>
          ) : pdf ? (
            <a className={styles.azione} href={url} target="_blank" rel="noopener">
              <ExternalLink size={18} strokeWidth={1.75} aria-hidden />
              Apri{' '}
              <span className="visually-hidden">
                {nome}
                {NUOVA_SCHEDA}
              </span>
            </a>
          ) : null}
          <a className={styles.azione} href={url} download={filename || true}>
            <Download size={18} strokeWidth={1.75} aria-hidden />
            Scarica <span className="visually-hidden">{nome}</span>
          </a>
        </div>
      </div>
      {nelSito && anteprima !== false ? <AnteprimaPdf url={url} nome={nome} /> : null}
    </section>
  )
}
