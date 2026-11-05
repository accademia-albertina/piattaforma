import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Alert, Blocchi, Breadcrumbs, TestataPagina } from '@/components'
import { antenati, sorelle, sottopagine, trovaPagina } from '@/lib/pagine'

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
  const [su, figlie, vicine] = await Promise.all([
    antenati(pagina),
    sottopagine(pagina),
    sorelle(pagina),
  ])
  const genitore = su.at(-1)

  // I contatti vanno nella colonna laterale (da computer) o subito sotto la testata (da telefono).
  const blocchi = pagina.blocchi ?? []
  const contatti = blocchi.filter((b) => b.blockType === 'contatti')
  const corpo = blocchi.filter((b) => b.blockType !== 'contatti')
  const conSezione = vicine.length > 1
  const conLato = contatti.length > 0 || conSezione

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

      <TestataPagina
        occhiello={genitore?.titolo}
        titolo={pagina.titolo}
        sommario={pagina.sommario}
      />

      <div className={styles.corpo} data-con-lato={conLato ? true : undefined}>
        {contatti.length > 0 ? (
          <div className={styles.contatti}>
            <Blocchi blocchi={contatti} variante="scheda" />
          </div>
        ) : null}

        {corpo.length > 0 ? (
          <div className={styles.principale}>
            <Blocchi blocchi={corpo} />
          </div>
        ) : null}

        {conSezione && genitore ? (
          <nav className={styles.sezione} aria-label={`Pagine della sezione ${genitore.titolo}`}>
            <h2 className={styles.sezioneTitolo}>
              <Link href={`/${genitore.percorso}`}>{genitore.titolo}</Link>
            </h2>
            <ul>
              {vicine.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/${v.percorso}`}
                    aria-current={v.id === pagina.id ? 'page' : undefined}
                  >
                    {v.titolo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      {figlie.length > 0 ? (
        <nav aria-labelledby="sottopagine" className={styles.figlie}>
          <div className={styles.figlieTesta}>
            <h2 id="sottopagine">In questa sezione</h2>
            <p>
              {figlie.length} {figlie.length === 1 ? 'pagina' : 'pagine'}
            </p>
          </div>
          <ul>
            {figlie.map((f, i) => (
              <li key={f.id}>
                <Link href={`/${f.percorso}`}>
                  <span className={styles.figliaNumero} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.figliaTitolo}>{f.titolo}</span>
                  {f.sommario ? <span className={styles.figliaSommario}>{f.sommario}</span> : null}
                  <span className={styles.figliaApri} aria-hidden="true">
                    Apri <ArrowRight size={16} strokeWidth={1.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  )
}
