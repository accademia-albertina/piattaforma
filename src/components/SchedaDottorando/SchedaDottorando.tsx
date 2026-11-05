import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import styles from './SchedaDottorando.module.css'

type Props = {
  nome: string
  href: string
  /** Riga sopra il nome: curriculum o ciclo. */
  dettaglio?: string | null
  progetto?: string | null
  foto?: { url: string; width?: number | null; height?: number | null } | null
  /** Livello del titolo con il nome (h3 dentro un gruppo, h2 da solo). */
  livello?: 2 | 3
}

const iniziali = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

/** Scheda di un dottorando nell'elenco: ritratto, nome, progetto di ricerca e invito al profilo. */
export function SchedaDottorando({ nome, href, dettaglio, progetto, foto, livello = 3 }: Props) {
  const Titolo = `h${livello}` as const
  return (
    <Link href={href} className={styles.scheda}>
      <div className={styles.ritratto}>
        {foto?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- l'ottimizzazione arriva con lo storage su Drive
          <img
            src={foto.url}
            alt=""
            width={foto.width ?? 600}
            height={foto.height ?? 750}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.iniziali} aria-hidden="true">
            {iniziali(nome)}
          </span>
        )}
      </div>
      <div className={styles.testo}>
        {dettaglio ? <p className={styles.dettaglio}>{dettaglio}</p> : null}
        <Titolo className={styles.nome}>{nome}</Titolo>
        {progetto ? <p className={styles.progetto}>{progetto}</p> : null}
        <span className={styles.apri} aria-hidden="true">
          Leggi il profilo <ArrowRight size={16} strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  )
}
