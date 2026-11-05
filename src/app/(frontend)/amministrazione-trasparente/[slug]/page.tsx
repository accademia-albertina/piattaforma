import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs, ElencoDocumenti, TestataPagina } from '@/components'
import { elencoTrasparenza, trovaTrasparenza } from '@/lib/albo-dati'
import { dividiLink } from '@/utilities/autolink'
import { formatData } from '@/utilities/format'

import styles from '../../albo/albo.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const voce = await trovaTrasparenza((await params).slug)
  if (!voce) return {}
  return {
    title: `${voce.titolo} · Amministrazione trasparente`,
    description: `Amministrazione trasparente dell’Accademia Albertina, sezione ${voce.sezione}: ${voce.titolo}.`,
    alternates: { canonical: `/amministrazione-trasparente/${voce.slug}` },
  }
}

function Paragrafo({ testo }: { testo: string }) {
  return (
    <p>
      {dividiLink(testo).map((p, i) =>
        p.tipo === 'link' ? (
          <a key={i} href={p.href}>
            {p.testo}
          </a>
        ) : (
          <span key={i}>{p.testo}</span>
        ),
      )}
    </p>
  )
}

export default async function SottosezionePage({ params }: Props) {
  const voce = await trovaTrasparenza((await params).slug)
  if (!voce) notFound()
  const vicine = (await elencoTrasparenza()).filter((v) => v.sezione === voce.sezione)
  const paragrafi = (voce.testo ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const documenti = voce.documenti ?? []
  const aggiornato = voce.aggiornatoIl ?? voce.updatedAt

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Amministrazione trasparente', href: '/amministrazione-trasparente' },
          { label: voce.titolo },
        ]}
      />
      <TestataPagina occhiello={voce.sezione} titolo={voce.titolo}>
        <p className={styles.vuoto}>
          Ultimo aggiornamento: <time dateTime={aggiornato}>{formatData(aggiornato)}</time>
        </p>
      </TestataPagina>

      <div className={styles.corpo}>
        <div className={styles.principale}>
          {paragrafi.length > 0 ? (
            <div className={styles.testo}>
              {paragrafi.map((p, i) => (
                <Paragrafo key={i} testo={p} />
              ))}
            </div>
          ) : null}

          {documenti.length > 0 ? (
            <section aria-labelledby="documenti-titolo">
              <h2 id="documenti-titolo" className={styles.documentiTitolo}>
                Documenti
              </h2>
              <ElencoDocumenti documenti={documenti} />
            </section>
          ) : null}

          {paragrafi.length === 0 && documenti.length === 0 ? (
            <p className={styles.vuoto}>
              Per questa sottosezione non ci sono al momento contenuti da pubblicare.
            </p>
          ) : null}
        </div>

        {vicine.length > 1 ? (
          <nav aria-label={`Pagine della sezione ${voce.sezione}`} className={styles.lato}>
            <p className={styles.latoTitolo}>
              <Link href="/amministrazione-trasparente">{voce.sezione}</Link>
            </p>
            <ul>
              {vicine.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/amministrazione-trasparente/${v.slug}`}
                    aria-current={v.id === voce.id ? 'page' : undefined}
                  >
                    {v.titolo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
