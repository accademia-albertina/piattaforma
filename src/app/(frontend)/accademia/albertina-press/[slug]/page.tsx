import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs, TestataPagina } from '@/components'
import { nomeCollana, PERCORSO_PRESS } from '@/collections/Pubblicazioni'
import { hrefCatalogo, prezzoEuro, trovaPubblicazione } from '@/lib/pubblicazioni'
import type { Media } from '@/payload-types'
import { tronca } from '@/utilities/lexicalText'

import styles from './pubblicazione.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await trovaPubblicazione((await params).slug)
  if (!p) return { title: 'Pubblicazione non trovata' }
  return {
    title: `${p.titolo} – Albertina Press`,
    description: p.descrizione
      ? tronca(p.descrizione, 200)
      : `Volume del catalogo Albertina Press, la casa editrice dell’Accademia Albertina.`,
    alternates: { canonical: `${PERCORSO_PRESS}/${p.slug}` },
  }
}

export default async function PubblicazionePage({ params }: Props) {
  const p = await trovaPubblicazione((await params).slug)
  if (!p) notFound()
  const copertina = typeof p.copertina === 'object' ? (p.copertina as Media | null) : null
  const collana = nomeCollana(p.collana)

  const dati: [string, string][] = [
    ['Numero di catalogo', p.numero ? String(p.numero).padStart(3, '0') : ''],
    ['Luogo, editore e anno', p.luogoAnno ?? (p.anno ? String(p.anno) : '')],
    ['Pagine', p.pagine ? String(p.pagine) : ''],
    ['Formato', p.dimensioni ?? ''],
    ['Lingua', p.lingua ?? ''],
    ['ISBN', p.isbn ?? ''],
    ['Prezzo', p.prezzo ? prezzoEuro(p.prezzo) : ''],
  ].filter((d): d is [string, string] => Boolean(d[1]))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: p.titolo,
    ...(p.isbn ? { isbn: p.isbn } : {}),
    ...(p.anno ? { datePublished: String(p.anno) } : {}),
    ...(p.pagine ? { numberOfPages: p.pagine } : {}),
    ...(p.lingua ? { inLanguage: p.lingua } : {}),
    ...(collana ? { isPartOf: { '@type': 'BookSeries', name: collana } } : {}),
    publisher: { '@type': 'Organization', name: 'Albertina Press' },
  }

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Accademia', href: '/accademia' },
          { label: 'Albertina Press', href: PERCORSO_PRESS },
          { label: p.titolo },
        ]}
      />

      <TestataPagina
        occhiello={collana ? `Collana ${collana}` : 'Albertina Press'}
        titolo={p.titolo}
        sommario={p.autori}
        media={
          copertina?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- immagine dal pannello, già ottimizzata
            <img
              src={copertina.url}
              alt={copertina.alt || `Copertina di “${p.titolo}”`}
              width={copertina.width ?? undefined}
              height={copertina.height ?? undefined}
              className={styles.copertina}
            />
          ) : undefined
        }
      >
        {dati.length ? (
          <dl className={styles.dati} aria-label="Dati bibliografici">
            {dati.map(([etichetta, valore]) => (
              <div key={etichetta}>
                <dt>{etichetta}</dt>
                <dd>{valore}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </TestataPagina>

      <div className={styles.corpo}>
        {p.descrizione ? (
          <section aria-labelledby="descrizione">
            <h2 id="descrizione" className={styles.sezioneTitolo}>
              Il volume
            </h2>
            <div className={styles.testo}>
              {p.descrizione.split(/\n{2,}/).map((par, i) => (
                <p key={i}>{par}</p>
              ))}
            </div>
          </section>
        ) : null}

        {p.indice?.length ? (
          <section aria-labelledby="indice">
            <h2 id="indice" className={styles.sezioneTitolo}>
              Indice
            </h2>
            <ol className={styles.indice}>
              {p.indice.map((v) => (
                <li key={v.id ?? v.titolo}>
                  <span className={styles.voceTitolo}>{v.titolo}</span>
                  {v.autori ? <span className={styles.voceAutori}>{v.autori}</span> : null}
                  {v.pagina ? (
                    <span className={styles.vocePagina}>
                      <span className="visually-hidden">pagina </span>
                      {v.pagina}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <p>
          <Link href={hrefCatalogo({ collana: p.collana ?? undefined })} className={styles.torna}>
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />{' '}
            {collana ? `Altri volumi della collana ${collana}` : 'Tutto il catalogo'}
          </Link>
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </article>
  )
}
