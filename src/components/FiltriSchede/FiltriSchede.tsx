import Link from 'next/link'

import styles from './FiltriSchede.module.css'

export type Scheda = { label: string; href: string; attiva?: boolean }

/**
 * Filtri a schede: testo con sottolineatura rossa sulla scheda attiva, come la navigazione
 * della Vetrina tesi. Non sembrano pulsanti; su mobile scorrono in orizzontale.
 */
export function FiltriSchede({ schede, label }: { schede: Scheda[]; label: string }) {
  return (
    <nav aria-label={label} className={styles.filtri}>
      <ul className={styles.lista}>
        {schede.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className={styles.scheda}
              aria-current={s.attiva ? 'page' : undefined}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
