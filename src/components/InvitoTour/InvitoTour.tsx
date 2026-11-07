import { ArrowUpRight } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'

import styles from './InvitoTour.module.css'

export type InvitoTourProps = {
  href: string
  immagine: StaticImageData
  titolo?: string
  testo?: string
}

/** Invito al virtual tour a tutta larghezza: foto delle sedi, velo scuro, titolo e pulsante. */
export function InvitoTour({
  href,
  immagine,
  titolo = 'Esplora l’Accademia',
  testo = 'Entra nelle aule, nei laboratori e negli spazi storici di via Accademia Albertina, da dove vuoi.',
}: InvitoTourProps) {
  return (
    <section aria-labelledby="invito-tour" className={styles.tour}>
      <Image src={immagine} alt="" fill sizes="100vw" className={styles.foto} />
      <div className={`container ${styles.contenuto}`}>
        <p className={styles.occhiello}>Virtual tour</p>
        <h2 id="invito-tour" className={styles.titolo}>
          {titolo}
        </h2>
        <p className={styles.testo}>{testo}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className={`btn btn-chiaro btn-lg ${styles.pulsante}`}
        >
          Inizia il tour
          <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden />
          <span className="visually-hidden"> (si apre in una nuova scheda)</span>
        </a>
      </div>
    </section>
  )
}
