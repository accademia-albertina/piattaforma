import { ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import styles from './AccessiRapidi.module.css'

export type AccessoRapido = {
  titolo: string
  testo: string
  href: string
  icona: LucideIcon
}

export type AccessiRapidiProps = {
  titolo?: string
  testo?: string
  voci: AccessoRapido[]
}

/**
 * Fascia chiara subito sotto lo slider: dice a chi arriva dov'è e gli dà le strade più
 * cercate, prima della parte emozionale. Solo collegamenti, nessuna interazione.
 */
export function AccessiRapidi({
  titolo = 'Da dove vuoi iniziare?',
  testo = 'Accademia Albertina di Belle Arti di Torino: Lauree e Lauree magistrali in arti visive, progettazione e nuove tecnologie.',
  voci,
}: AccessiRapidiProps) {
  return (
    <section aria-labelledby="accessi-rapidi" className={styles.fascia}>
      <div className={`container ${styles.griglia}`}>
        <div className={styles.intro}>
          <h2 id="accessi-rapidi" className={styles.titolo}>
            {titolo}
          </h2>
          <p className={styles.testo}>{testo}</p>
        </div>
        <ul className={styles.voci}>
          {voci.map(({ titolo: t, testo: d, href, icona: Icona }) => (
            <li key={href}>
              <Link href={href} className={styles.voce}>
                <Icona className={styles.icona} size={28} strokeWidth={1.5} aria-hidden />
                <span className={styles.nome}>{t}</span>
                <span className={styles.descrizione}>{d}</span>
                <ArrowRight className={styles.freccia} size={20} strokeWidth={1.5} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
