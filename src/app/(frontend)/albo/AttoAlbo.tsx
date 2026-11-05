import { ElencoDocumenti } from '@/components'
import {
  formatoDocumento,
  hrefDocumento,
  inCorso,
  SEZIONE_ALBO,
  type SezioneAlbo,
} from '@/lib/albo'
import type { AttoAlbo as Atto } from '@/payload-types'
import { formatData } from '@/utilities/format'

import styles from './albo.module.css'

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/** Un atto dell'Albo in elenco: categoria, date, titolo e documenti. */
export function AttoAlbo({
  atto,
  livello = 2,
  conSezione = false,
}: {
  atto: Atto
  livello?: 2 | 3
  /** Mostra la sezione al posto della categoria (negli elenchi che mescolano le sezioni). */
  conSezione?: boolean
}) {
  const Titolo = livello === 2 ? 'h2' : 'h3'
  const documenti = atto.documenti ?? []
  // Un solo documento con lo stesso nome dell'atto: il titolo stesso porta al documento.
  const unico =
    documenti.length === 1 && norm(documenti[0].nome) === norm(atto.titolo)
      ? hrefDocumento(documenti[0])
      : null
  const formatoUnico = unico ? formatoDocumento(unico) : null
  const aperto = inCorso(atto.scadenza)
  const etichetta = conSezione ? SEZIONE_ALBO[atto.sezione as SezioneAlbo]?.titolo : atto.categoria
  return (
    <article className={styles.atto} aria-labelledby={`atto-${atto.id}`}>
      <p className={styles.meta}>
        <span className={styles.categoria}>{etichetta}</span>
        <span>
          Pubblicato il <time dateTime={atto.pubblicatoIl}>{formatData(atto.pubblicatoIl)}</time>
        </span>
        {atto.annoAccademico ? <span>A.A. {atto.annoAccademico}</span> : null}
      </p>
      <Titolo id={`atto-${atto.id}`} className={styles.attoTitolo}>
        {unico ? (
          <a href={unico}>
            {atto.titolo}
            {formatoUnico ? <span className={styles.formato}> ({formatoUnico})</span> : null}
          </a>
        ) : (
          atto.titolo
        )}
      </Titolo>
      {atto.scadenza ? (
        <p className={styles.scadenza} data-aperto={aperto || undefined}>
          {aperto ? 'Domande entro il ' : 'Scaduto il '}
          <time dateTime={atto.scadenza}>{formatData(atto.scadenza)}</time>
        </p>
      ) : null}
      {atto.descrizione ? <p className={styles.descrizione}>{atto.descrizione}</p> : null}
      {unico ? null : <ElencoDocumenti documenti={documenti} compatto />}
    </article>
  )
}
