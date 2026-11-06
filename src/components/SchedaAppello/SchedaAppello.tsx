import type { ReactNode } from 'react'

import styles from './SchedaAppello.module.css'

export type SchedaAppelloProps = {
  /** Titolo della scheda: il corso (con link) negli elenchi, il giorno nella pagina del corso. */
  titolo: ReactNode
  livelloTitolo?: 3 | 4
  /** Giorno e ora; si omettono quando sono già nel titolo. */
  giorno?: string
  ora?: string
  aula?: string | null
  livelli?: string | null
  docenti?: string | null
  commissione?: string | null
  note?: string | null
  /** Pulsante d'iscrizione. */
  children?: ReactNode
}

/** Un appello d'esame: dati essenziali a sinistra, iscrizione a destra. Pannello pieno, senza bordi. */
export function SchedaAppello({
  titolo,
  livelloTitolo = 3,
  giorno,
  ora,
  aula,
  livelli,
  docenti,
  commissione,
  note,
  children,
}: SchedaAppelloProps) {
  const Titolo = `h${livelloTitolo}` as const
  return (
    <div className={styles.scheda}>
      <div className={styles.dati}>
        <Titolo className={styles.titolo}>{titolo}</Titolo>
        <dl className={styles.elenco}>
          {giorno ? (
            <div>
              <dt>Quando</dt>
              <dd>
                {giorno}
                {ora ? `, ore ${ora}` : ''}
              </dd>
            </div>
          ) : ora ? (
            <div>
              <dt>Ora</dt>
              <dd>{ora}</dd>
            </div>
          ) : null}
          {aula ? (
            <div>
              <dt>Aula</dt>
              <dd>{aula}</dd>
            </div>
          ) : null}
          {livelli ? (
            <div>
              <dt>Livello</dt>
              <dd>{livelli}</dd>
            </div>
          ) : null}
          {docenti ? (
            <div>
              <dt>Docente</dt>
              <dd>{docenti}</dd>
            </div>
          ) : null}
          {commissione ? (
            <div>
              <dt>Commissione</dt>
              <dd>{commissione}</dd>
            </div>
          ) : null}
        </dl>
        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
      {children ? <div className={styles.azione}>{children}</div> : null}
    </div>
  )
}
