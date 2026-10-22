import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Alert, Blocchi, Breadcrumbs } from '@/components'
import { antenati, sottopagine, trovaPagina } from '@/lib/pagine'

import styles from './pagina.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ percorso: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trovata = await trovaPagina((await params).percorso)
  if (!trovata) return { title: 'Pagina non trovata' }
  const { pagina, bozza } = trovata
  return {
    title: pagina.titolo,
    description: pagina.sommario ?? undefined,
    alternates: { canonical: `/${pagina.percorso}` },
    openGraph: { title: pagina.titolo, description: pagina.sommario ?? undefined },
    robots: bozza ? { index: false } : undefined,
  }
}

export default async function PaginaIstituzionale({ params }: Props) {
  const trovata = await trovaPagina((await params).percorso)
  if (!trovata) notFound()
  const { pagina, bozza } = trovata
  const [su, figlie] = await Promise.all([antenati(pagina), sottopagine(pagina)])

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          ...su.map((p) => ({ label: p.titolo, href: `/${p.percorso}` })),
          { label: pagina.titolo },
        ]}
      />
      {bozza ? (
        <Alert tone="warning" title="Anteprima">
          Stai vedendo una bozza: il pubblico vede ancora l’ultima versione pubblicata.
        </Alert>
      ) : null}
      <header className={styles.header}>
        <h1>{pagina.titolo}</h1>
        {pagina.sommario ? <p className={styles.sommario}>{pagina.sommario}</p> : null}
      </header>

      <Blocchi blocchi={pagina.blocchi} />

      {figlie.length > 0 ? (
        <nav aria-labelledby="sottopagine" className={styles.figlie}>
          <h2 id="sottopagine">In questa sezione</h2>
          <ul>
            {figlie.map((f) => (
              <li key={f.id}>
                <Link href={`/${f.percorso}`}>
                  <span className={styles.figliaTitolo}>{f.titolo}</span>
                  {f.sommario ? <span className={styles.figliaSommario}>{f.sommario}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  )
}
