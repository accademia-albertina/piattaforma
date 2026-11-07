import type { ReactNode } from 'react'

import styles from './TestataPagina.module.css'

type Props = {
  /** Etichetta sopra il titolo (sezione, ruolo…): maiuscoletto rosso con filetto, come la Vetrina tesi. */
  occhiello?: string | null
  titolo: string
  /** Testo d'apertura, più grande del corpo. */
  sommario?: string | null
  /** Immagine o altro contenuto a destra del titolo (da computer). */
  media?: ReactNode
  /** “copertina”: da telefono l'immagine va a tutta larghezza (scuole); di serie resta piccola. */
  formatoMedia?: 'piccolo' | 'copertina'
  /** Contenuto sotto il sommario: dati essenziali, pulsanti. */
  children?: ReactNode
}

/** Testata delle pagine interne: occhiello, titolo grande, sommario e filetto a tutta larghezza. */
export function TestataPagina({
  occhiello,
  titolo,
  sommario,
  media,
  formatoMedia = 'piccolo',
  children,
}: Props) {
  return (
    <header
      className={styles.testata}
      data-con-media={media ? true : undefined}
      data-media={media ? formatoMedia : undefined}
    >
      <div className={styles.testo}>
        {occhiello ? <p className={styles.occhiello}>{occhiello}</p> : null}
        <h1 className={styles.titolo}>{titolo}</h1>
        {sommario ? <p className={styles.sommario}>{sommario}</p> : null}
        {children ? <div className={styles.extra}>{children}</div> : null}
      </div>
      {media ? <div className={styles.media}>{media}</div> : null}
    </header>
  )
}
