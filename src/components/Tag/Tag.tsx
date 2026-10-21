import Link from 'next/link'
import type { ReactNode } from 'react'

import styles from './Tag.module.css'

export type TagProps = {
  children: ReactNode
  /** Se presente il tag è un link (es. categoria di un avviso). */
  href?: string
  tone?: 'neutral' | 'brand'
  /** Filtro attivo: evidenziato e annunciato come pagina corrente. */
  current?: boolean
}

export function Tag({ children, href, tone = 'neutral', current = false }: TagProps) {
  const className = `${styles.tag} ${styles[tone]}`
  if (href) {
    return (
      <Link className={className} href={href} aria-current={current ? 'page' : undefined}>
        {children}
      </Link>
    )
  }
  return <span className={className}>{children}</span>
}
