import { Testo } from '@/components/Testo/Testo'
import { emailSpezzabile } from '@/utilities/email'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Fragment } from 'react'

import { RUOLO_DOCENTE_LABELS, annoAccademicoCorrente } from '@/access/corsi'
import { Breadcrumbs, Fisarmonica, TestataPagina } from '@/components'
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

  const elenco = (lista: typeof corsi, id?: string) => (
    <table className={styles.corsi} aria-labelledby={id}>
      <thead>
        <tr>
          <th scope="col">Corso</th>
          <th scope="col">Livello</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((c) => (
          <tr key={c.id}>
            <td>
              <Link href={`/corsi/${c.slug}`}>{c.titolo}</Link>
            </td>
            <td className={styles.livello}>{etichettaLivelli(c.livelli)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

      <TestataPagina
        occhiello={
          docente.attivo
            ? docente.ruolo
              ? RUOLO_DOCENTE_LABELS[docente.ruolo]
              : 'Docente'
            : 'Non più in servizio'
        }
        titolo={docente.nomeCompleto ?? ''}
        sommario={scuole[0]?.nome ?? null}
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
        <dl className={styles.dati} aria-label="Scuole e contatti">
          {scuole.length > 0 ? (
            <div>
              <dt>Scuola di afferenza</dt>
              <dd>
                <Link href={`/scuole/${scuole[0].slug}`}>{scuole[0].nome}</Link>
              </dd>
            </div>
          ) : null}
          {scuole.length > 1 ? (
            <div>
              <dt>Pro-afferente a</dt>
              <dd>
                {scuole.slice(1).map((s, i) => (
                  <Fragment key={s.id}>
                    {i > 0 ? ', ' : null}
                    <Link href={`/scuole/${s.slug}`}>{s.nome}</Link>
                  </Fragment>
                ))}
              </dd>
            </div>
          ) : null}
          {docente.email ? (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${docente.email}`}>{emailSpezzabile(docente.email)}</a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Ricevimento</dt>
            <dd>{docente.ricevimento || 'Su appuntamento, scrivendo al docente.'}</dd>
          </div>
          {cv?.url ? (
            <div>
              <dt>Curriculum</dt>
              <dd>
                <a href={cv.url} download>
                  Scarica il PDF
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </TestataPagina>

      <div className={styles.corpo}>
        <section aria-labelledby="corsi-correnti">
          <h2 id="corsi-correnti" className={styles.sezioneTitolo}>
            Corsi A.A. {anno}
          </h2>
          {correnti.length > 0 ? (
            elenco(correnti, 'corsi-correnti')
          ) : (
            <p className={styles.vuoto}>Nessun corso in questo anno accademico.</p>
          )}
        </section>

        {docente.biografia ? (
          <section aria-labelledby="biografia">
            <h2 id="biografia" className={styles.sezioneTitolo}>
              Biografia
            </h2>
            <Testo data={docente.biografia} className={styles.body} />
          </section>
        ) : null}

        {passati.size > 0 ? (
          <section aria-labelledby="corsi-passati">
            <h2 id="corsi-passati" className={styles.sezioneTitolo}>
              Anni precedenti
            </h2>
            <Fisarmonica
              voci={[...passati.entries()].map(([a, lista]) => ({
                id: a,
                titolo: `A.A. ${a}`,
                contenuto: elenco(lista),
              }))}
            />
          </section>
        ) : null}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </article>
  )
}
