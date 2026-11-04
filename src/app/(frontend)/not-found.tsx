import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'

import styles from './not-found.module.css'

/** Pagine più cercate: via d'uscita per chi arriva da un link vecchio o da Google. */
const LINK_RAPIDI = [
  { label: 'Avvisi', href: '/avvisi' },
  { label: 'Corsi', href: '/corsi' },
  { label: 'Docenti', href: '/docenti' },
  { label: 'Ammissioni', href: '/ammissioni' },
]

export default function NotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.testo}>
        <p className="eyebrow">Errore 404</p>
        <h1 className={styles.titolo}>Pagina non trovata</h1>
        <p className={styles.intro}>
          L’indirizzo potrebbe essere cambiato con il nuovo sito. Cerca qui sotto oppure parti da
          una di queste pagine.
        </p>

        <form method="get" action="/cerca" role="search" className={styles.cerca}>
          <label htmlFor="cerca-404" className="visually-hidden">
            Cerca nel sito
          </label>
          <input
            id="cerca-404"
            name="q"
            type="search"
            placeholder="Cerca avvisi, corsi, docenti…"
            minLength={2}
            maxLength={100}
            required
          />
          <button type="submit" className="btn btn-primario">
            <Search size={18} strokeWidth={1.5} aria-hidden />
            Cerca
          </button>
        </form>

        <nav aria-label="Pagine utili" className={styles.rapidi}>
          <ul>
            {LINK_RAPIDI.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  {l.label}
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/" className="btn btn-secondario">
          Torna alla home
        </Link>
      </div>

      {/* La faccina del sito attuale, più piccola e leggera */}
      <svg className={styles.faccina} viewBox="0 0 200 160" aria-hidden="true" focusable="false">
        <circle cx="60" cy="24" r="12" />
        <circle cx="140" cy="24" r="12" />
        <path d="M10 150 A 95 95 0 0 1 190 150" fill="none" strokeWidth="16" />
      </svg>
    </div>
  )
}
