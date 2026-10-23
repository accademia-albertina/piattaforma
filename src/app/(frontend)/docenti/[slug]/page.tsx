import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RUOLO_DOCENTE_LABELS, annoAccademicoCorrente } from '@/access/corsi'
import { Breadcrumbs, Fisarmonica } from '@/components'
import { corsiDelDocente, etichettaLivelli, trovaDocente } from '@/lib/corsi'
import type { Media, Scuola } from '@/payload-types'
import { lexicalToText } from '@/utilities/lexicalText'

import styles from './docente.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const docente = await trovaDocente((await params).slug)
  if (!docente) return { title: 'Docente non trovato' }
  return {
    title: docente.nomeCompleto ?? 'Docente',
    description:
      lexicalToText(docente.biografia, 200) ||
      `${docente.nomeCompleto}, docente dell’Accademia Albertina: corsi, ricevimento e contatti.`,
    alternates: { canonical: `/docenti/${docente.slug}` },
  }
}

export default async function DocentePage({ params }: Props) {
  const docente = await trovaDocente((await params).slug)
  if (!docente) notFound()

  const corsi = await corsiDelDocente(docente.id)
  const anno = annoAccademicoCorrente()
  const correnti = corsi.filter((c) => c.annoAccademico === anno)
  const passati = new Map<string, typeof corsi>()
  for (const c of corsi) {
    if (c.annoAccademico === anno) continue
    passati.set(c.annoAccademico, [...(passati.get(c.annoAccademico) ?? []), c])
  }
  const scuole = (docente.scuole ?? []).filter((s): s is Scuola => typeof s === 'object')
  const foto = typeof docente.foto === 'object' ? (docente.foto as Media | null) : null
  const cv = typeof docente.cv === 'object' ? (docente.cv as Media | null) : null

  const elenco = (lista: typeof corsi) => (
    <ul className={styles.corsi}>
      {lista.map((c) => (
        <li key={c.id}>
          <Link href={`/corsi/${c.slug}`}>{c.titolo}</Link>{' '}
          <span className={styles.livello}>{etichettaLivelli(c.livelli)}</span>
        </li>
      ))}
    </ul>
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: docente.nomeCompleto,
    jobTitle: docente.ruolo ? RUOLO_DOCENTE_LABELS[docente.ruolo] : 'Docente',
    ...(docente.email ? { email: docente.email } : {}),
    worksFor: {
      '@type': 'CollegeOrUniversity',
      name: 'Accademia Albertina di Belle Arti di Torino',
    },
  }

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docenti', href: '/docenti' },
          { label: docente.nomeCompleto ?? '' },
        ]}
      />

      <header className={styles.header}>
        {foto?.url ? (
          <Image
            src={foto.url}
            alt=""
            width={foto.width ?? 240}
            height={foto.height ?? 300}
            className={styles.foto}
            sizes="10rem"
          />
        ) : null}
        <div>
          <h1>{docente.nomeCompleto}</h1>
          {docente.ruolo ? (
            <p className={styles.ruolo}>{RUOLO_DOCENTE_LABELS[docente.ruolo]}</p>
          ) : null}
          {!docente.attivo ? <p className={styles.ruolo}>Non più in servizio</p> : null}
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section aria-labelledby="corsi-correnti">
            <h2 id="corsi-correnti">Corsi A.A. {anno}</h2>
            {correnti.length > 0 ? (
              elenco(correnti)
            ) : (
              <p className={styles.vuoto}>Nessun corso in questo anno accademico.</p>
            )}
          </section>

          {passati.size > 0 ? (
            <section aria-labelledby="corsi-passati">
              <h2 id="corsi-passati">Anni precedenti</h2>
              <Fisarmonica
                voci={[...passati.entries()].map(([a, lista]) => ({
                  id: a,
                  titolo: `A.A. ${a}`,
                  contenuto: elenco(lista),
                }))}
              />
            </section>
          ) : null}

          {docente.biografia ? (
            <section aria-labelledby="biografia">
              <h2 id="biografia">Biografia</h2>
              <RichText data={docente.biografia} className={styles.body} />
            </section>
          ) : null}
        </div>

        <aside className={styles.scheda} aria-labelledby="contatti">
          <h2 id="contatti" className={styles.schedaTitolo}>
            Contatti
          </h2>
          <dl className={styles.dati}>
            {docente.email ? (
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${docente.email}`}>{docente.email}</a>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Ricevimento</dt>
              <dd>{docente.ricevimento || 'Su appuntamento, scrivendo al docente.'}</dd>
            </div>
            {scuole.length > 0 ? (
              <div>
                <dt>{scuole.length > 1 ? 'Scuole' : 'Scuola'}</dt>
                <dd>{scuole.map((s) => s.nome).join(', ')}</dd>
              </div>
            ) : null}
          </dl>
          {cv?.url ? (
            <p className={styles.cv}>
              <a href={cv.url} download>
                Scarica il curriculum <span className={styles.formato}>(PDF)</span>
              </a>
            </p>
          ) : null}
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </article>
  )
}
