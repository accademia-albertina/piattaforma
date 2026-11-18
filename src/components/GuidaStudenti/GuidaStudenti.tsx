import { GUIDA_STUDENTI, LINK_ISIDATA } from '@/content/guida-studenti'

import { Fisarmonica } from '../Fisarmonica/Fisarmonica'
import { SchermataSito } from '../SchermataSito/SchermataSito'
import styles from './GuidaStudenti.module.css'

/**
 * Guida per gli studenti: una voce per ogni operazione, passi numerati e, dove c'è, la
 * schermata del sito con gli stessi numeri. Si usa in “La mia area” e nella pagina Guide.
 */
export function GuidaStudenti({ livello = 3 }: { livello?: 2 | 3 | 4 }) {
  return (
    <Fisarmonica
      livello={livello}
      voci={GUIDA_STUDENTI.map((v) => ({
        id: v.id,
        titolo: v.titolo,
        contenuto: (
          <>
            <ol className={styles.passi}>
              {v.passi.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            {v.schermata ? (
              <SchermataSito id={`studenti-${v.id}`} didascalia={v.schermata} />
            ) : null}
            {v.id === 'isidata' ? (
              <p>
                <a href={LINK_ISIDATA} target="_blank" rel="noreferrer">
                  Vai a Isidata (si apre in una nuova scheda)
                </a>
              </p>
            ) : null}
          </>
        ),
      }))}
    />
  )
}
