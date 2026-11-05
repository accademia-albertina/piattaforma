import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import styles from './SchedaPubblicazione.module.css'

export type SchedaPubblicazioneProps = {
  titolo: string
  href: string
  collana?: string | null
  anno?: number | null
  copertina?: { url: string; width?: number | null; height?: number | null } | null
  livello?: 2 | 3
}

/** Scheda di un volume del catalogo Albertina Press: copertina, collana, titolo, anno e invito. */
export function SchedaPubblicazione({
  titolo,
  href,
  collana,
  anno,
  copertina,
  livello = 2,
}: SchedaPubblicazioneProps) {
  const Titolo = `h${livello}` as 'h2' | 'h3'
  const dettaglio = [collana, anno].filter(Boolean).join(' · ')
  return (
    <Link href={href} className={styles.scheda}>
      <span className={styles.copertina}>
        {copertina?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- immagine dal pannello, già ottimizzata
          <img
            src={copertina.url}
            alt=""
            width={copertina.width ?? undefined}
            height={copertina.height ?? undefined}
            loading="lazy"
          />
        ) : (
          <span className={styles.senza} aria-hidden="true">
            Albertina Press
          </span>
        )}
      </span>
      <span className={styles.testo}>
        {dettaglio ? <span className={styles.dettaglio}>{dettaglio}</span> : null}
        <Titolo className={styles.titolo}>{titolo}</Titolo>
        <span className={styles.invito}>
          Vedi la scheda <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
        </span>
      </span>
    </Link>
  )
}
