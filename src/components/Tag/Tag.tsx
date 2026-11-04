import Link from 'next/link'
import type { ReactNode } from 'react'

import styles from './Tag.module.css'

export type TagProps = {
  children: ReactNode
  /** Se presente l'etichetta è un link (es. categoria di un avviso). */
  href?: string
  tone?: 'neutral' | 'brand'
}

/** Etichetta piccola (categoria, livello, anno). Per i filtri usa FiltriSchede. */
export function Tag({ children, href, tone = 'neutral' }: TagProps) {
  const className = `${styles.tag} ${styles[tone]}`
  if (href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    )
  }
  return <span className={className}>{children}</span>
}
