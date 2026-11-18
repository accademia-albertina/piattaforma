import { Download, ExternalLink } from 'lucide-react'

import { formatDimensione, formatTipoFile } from '@/utilities/format'
import { NUOVA_SCHEDA, isPdf } from '@/utilities/pdf'

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
  /** Id del titolo (da cambiare se nella pagina ci sono più documenti). */
  id: string
}

/**
 * Documento in evidenza nella pagina (es. il regolamento delle tasse): titolo, formato e peso,
 * pulsanti per aprirlo e scaricarlo e, da tablet in su, l'anteprima del PDF incorporata.
 * L'anteprima usa il lettore PDF del browser, in attesa del visualizzatore del sito.
 */
export function Documento({
  nome,
  url,
  filename,
  mimeType,
  filesize,
  descrizione,
  id,
}: DocumentoProps) {
  const pdf = isPdf(url, mimeType)
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
          {pdf ? (
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
      {pdf ? (
        <iframe
          className={styles.anteprima}
          src={`${url}#view=FitH`}
          title={`Anteprima: ${nome}`}
          loading="lazy"
        />
      ) : null}
    </section>
  )
}
