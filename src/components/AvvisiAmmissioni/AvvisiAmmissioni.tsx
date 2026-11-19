import { Attachments } from '@/components/Attachments/Attachments'
import { Fisarmonica } from '@/components/Fisarmonica/Fisarmonica'
import { Testo } from '@/components/Testo/Testo'
import type { GruppoAmmissioni } from '@/lib/avvisi-ammissioni'
import { formatData } from '@/utilities/format'

import styles from './AvvisiAmmissioni.module.css'

/**
 * Avvisi dei coordinatori nella pagina Ammissioni: una voce per scuola, con gli avvisi dal
 * più recente. Le scuole senza avvisi non compaiono.
 */
export function AvvisiAmmissioni({
  gruppi,
  livello = 3,
}: {
  gruppi: GruppoAmmissioni[]
  /** Livello dei titoli delle scuole; quelli degli avvisi sono il livello successivo. */
  livello?: 2 | 3
}) {
  if (gruppi.length === 0)
    return <p className={styles.vuoto}>Al momento non ci sono avvisi dei coordinatori.</p>
  const livelloAvviso = (livello + 1) as 3 | 4
  const TitoloAvviso = `h${livelloAvviso}` as const
  return (
    <Fisarmonica
      livello={livello}
      voci={gruppi.map((g) => ({
        id: `ammissioni-${g.scuola.id}`,
        titolo: g.scuola.nome,
        contenuto: (
          <ul className={styles.elenco}>
            {g.avvisi.map((a) => (
              <li key={a.id}>
                <article
                  className={styles.avviso}
                  aria-labelledby={`ammissioni-${g.scuola.id}-${a.id}`}
                >
                  <TitoloAvviso id={`ammissioni-${g.scuola.id}-${a.id}`} className={styles.titolo}>
                    {a.titolo}
                  </TitoloAvviso>
                  <p className={styles.data}>
                    Pubblicato il{' '}
                    <time dateTime={a.pubblicatoIl}>{formatData(a.pubblicatoIl)}</time>
                  </p>
                  {a.contenuto ? <Testo data={a.contenuto} /> : null}
                  <Attachments
                    items={a.allegati}
                    id={`ammissioni-${g.scuola.id}-${a.id}-allegati`}
                    livello={(livelloAvviso + 1) as 4 | 5}
                  />
                </article>
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  )
}
