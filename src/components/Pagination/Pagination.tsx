import Link from 'next/link'

import styles from './Pagination.module.css'

export type PaginationProps = {
  page: number
  totalPages: number
  /** Costruisce l'URL di una pagina mantenendo gli altri filtri. */
  hrefFor: (page: number) => string
}

/** Pagine da mostrare: prima, ultima, corrente ±1, con "…" negli intervalli. */
export function pageWindow(page: number, total: number): (number | '…')[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginazione" className={styles.nav}>
      <ul className={styles.list}>
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={styles.step} rel="prev">
              Precedente
            </Link>
          ) : null}
        </li>
        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true" className={styles.gap}>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                className={styles.page}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Pagina ${p}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} className={styles.step} rel="next">
              Successiva
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  )
}
