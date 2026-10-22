import type { Metadata } from 'next'

import { AvvisoCard, Breadcrumbs, Pagination } from '@/components'
import { categorieAvviso, cercaAvvisi, sommarioAvviso } from '@/lib/avvisi'

import styles from './cerca.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cerca',
  robots: { index: false },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function CercaPage({ searchParams }: Props) {
  const params = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const q = (first(params.q) ?? '').trim().slice(0, 100)
  const pagina = Math.max(1, Math.min(Number.parseInt(first(params.pagina) ?? '1', 10) || 1, 1000))
  const risultati = q.length >= 2 ? await cercaAvvisi(q, pagina) : null

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cerca' }]} />
      <h1>Cerca nel sito</h1>

      <form method="get" action="/cerca" role="search" className={styles.form}>
        <label htmlFor="cerca-q">Cosa cerchi?</label>
        <div className={styles.row}>
          <input
            id="cerca-q"
            name="q"
            type="search"
            defaultValue={q}
            minLength={2}
            maxLength={100}
            required
          />
          <button type="submit">Cerca</button>
        </div>
      </form>

      {risultati ? (
        <>
          <p className={styles.count} role="status">
            {risultati.totalDocs === 0
              ? `Nessun risultato per “${q}”.`
              : `${risultati.totalDocs === 1 ? '1 risultato' : `${risultati.totalDocs} risultati`} per “${q}” negli avvisi`}
          </p>
          {risultati.docs.length > 0 ? (
            <ul className={styles.grid}>
              {risultati.docs.map((a) => (
                <li key={a.id}>
                  <AvvisoCard
                    titolo={a.titolo}
                    href={`/avvisi/${a.slug}`}
                    data={a.pubblicatoIl}
                    sommario={sommarioAvviso(a)}
                    categorie={categorieAvviso(a)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <Pagination
            page={risultati.page ?? 1}
            totalPages={risultati.totalPages}
            hrefFor={(p) =>
              `/cerca?${new URLSearchParams({ q, ...(p > 1 ? { pagina: String(p) } : {}) })}`
            }
          />
        </>
      ) : null}
    </div>
  )
}
