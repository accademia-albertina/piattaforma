import Link from 'next/link'

import type { VoceMenu } from '@/lib/navigazione'

/** Link di menu: i link esterni si aprono in una nuova scheda e lo dichiarano. */
export function MenuLink({
  voce,
  className,
  current,
}: {
  voce: VoceMenu
  className?: string
  current?: 'page'
}) {
  if (voce.esterno) {
    return (
      <a href={voce.href} className={className} target="_blank" rel="noopener noreferrer">
        {voce.label}
        <span aria-hidden="true">↗</span>
        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
      </a>
    )
  }
  return (
    <Link href={voce.href} className={className} aria-current={current}>
      {voce.label}
    </Link>
  )
}
