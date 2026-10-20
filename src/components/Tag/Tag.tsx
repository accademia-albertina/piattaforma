import type { ReactNode } from 'react'

import styles from './Tag.module.css'

export type TagProps = {
  children: ReactNode
  /** Se presente il tag è un link (es. categoria di un avviso). */
  href?: string
  tone?: 'neutral' | 'brand'
}

export function Tag({ children, href, tone = 'neutral' }: TagProps) {
  const className = `${styles.tag} ${styles[tone]}`
  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    )
  }
  return <span className={className}>{children}</span>
}
