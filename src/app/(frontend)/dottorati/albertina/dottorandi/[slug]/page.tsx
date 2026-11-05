import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs, TestataPagina } from '@/components'
import { Testo } from '@/components/Testo/Testo'
import { CURRICULUM_LABELS } from '@/collections/Dottorandi'
import { trovaDottorando } from '@/lib/dottorandi'
import type { Media } from '@/payload-types'
import { emailSpezzabile } from '@/utilities/email'
import { lexicalToText } from '@/utilities/lexicalText'

import styles from './dottorando.module.css'

export const dynamic = 'force-dynamic'

const ELENCO = '/dottorati/albertina/dottorandi'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await trovaDottorando((await params).slug)
  if (!d) return { title: 'Dottorando non trovato' }
  return {
    title: d.nomeCompleto ?? 'Dottorando',
    description:
      d.titoloProgetto ||
      lexicalToText(d.biografia, 200) ||
      `${d.nomeCompleto}, Dottorato di ricerca dell’Accademia Albertina.`,
    alternates: { canonical: `${ELENCO}/${d.slug}` },
  }
}

export default async function DottorandoPage({ params }: Props) {
  const d = await trovaDottorando((await params).slug)
  if (!d) notFound()
  const foto = typeof d.foto === 'object' ? (d.foto as Media | null) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: d.nomeCompleto,
    jobTitle: 'Dottorando di ricerca',
    ...(d.email ? { email: d.email } : {}),
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'Accademia Albertina di Belle Arti di Torino',
    },
  }

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dottorati', href: '/dottorati' },
          { label: 'Dottorati Accademia Albertina', href: '/dottorati/albertina' },
          { label: 'Dottorandi', href: ELENCO },
          { label: d.nomeCompleto ?? '' },
        ]}
      />

      <TestataPagina
        occhiello={d.attivo ? 'Dottorato di ricerca' : 'Dottorato concluso'}
        titolo={d.nomeCompleto ?? ''}
        sommario={d.curriculum ? `Curriculum ${CURRICULUM_LABELS[d.curriculum]}` : null}
        media={
          foto?.url ? (
            <Image
              src={foto.url}
              alt=""
              width={foto.width ?? 600}
              height={foto.height ?? 750}
              className={styles.foto}
              sizes="(min-width: 64rem) 22rem, 100vw"
              priority
            />
          ) : undefined
        }
      >
        <dl className={styles.dati} aria-label="Dati del dottorato">
          {d.email ? (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${d.email}`}>{emailSpezzabile(d.email)}</a>
              </dd>
            </div>
          ) : null}
          {d.ciclo ? (
            <div>
              <dt>Ciclo</dt>
              <dd>{d.ciclo}</dd>
            </div>
          ) : null}
          {d.supervisor ? (
            <div>
              <dt>Supervisor</dt>
              <dd>{d.supervisor}</dd>
            </div>
          ) : null}
          {d.cosupervisor ? (
            <div>
              <dt>Co-supervisor</dt>
              <dd>{d.cosupervisor}</dd>
            </div>
          ) : null}
        </dl>
      </TestataPagina>

      <div className={styles.corpo}>
        {d.titoloProgetto || d.abstract ? (
          <section aria-labelledby="progetto">
            <h2 id="progetto" className={styles.sezioneTitolo}>
              Progetto di ricerca
            </h2>
            {d.titoloProgetto ? <p className={styles.titoloProgetto}>{d.titoloProgetto}</p> : null}
            {d.abstract ? <Testo data={d.abstract} className={styles.body} /> : null}
          </section>
        ) : null}

        {d.biografia ? (
          <section aria-labelledby="biografia">
            <h2 id="biografia" className={styles.sezioneTitolo}>
              Biografia
            </h2>
            <Testo data={d.biografia} className={styles.body} />
          </section>
        ) : null}

        <p>
          <Link href={ELENCO} className={styles.torna}>
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden /> Tutti i dottorandi
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
