import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Attachments, Breadcrumbs, Tag } from '@/components'
import { categorieAvviso, sommarioAvviso, trovaAvviso } from '@/lib/avvisi'
import type { Media, Scuola } from '@/payload-types'
import { formatData } from '@/utilities/format'

import styles from './avviso.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const avviso = await trovaAvviso((await params).slug)
  if (!avviso) return { title: 'Avviso non trovato' }
  const description = sommarioAvviso(avviso)
  return {
    title: avviso.titolo,
    description,
    alternates: { canonical: `/avvisi/${avviso.slug}` },
    openGraph: {
      type: 'article',
      title: avviso.titolo,
      description,
      publishedTime: avviso.pubblicatoIl,
    },
  }
}

export default async function AvvisoPage({ params }: Props) {
  const avviso = await trovaAvviso((await params).slug)
  if (!avviso) notFound()

  const scuole = (avviso.scuole ?? []).filter((s): s is Scuola => typeof s === 'object')
  const allegati = (avviso.allegati ?? []).flatMap((a) => {
    const file = a.file as Media | number
    return typeof file === 'object' && file.url
      ? [
          {
            nome: a.nome,
            url: file.url,
            filename: file.filename,
            mimeType: file.mimeType,
            filesize: file.filesize,
          },
        ]
      : []
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: avviso.titolo,
    datePublished: avviso.pubblicatoIl,
    dateModified: avviso.updatedAt,
    publisher: {
      '@type': 'CollegeOrUniversity',
      name: 'Accademia Albertina di Belle Arti di Torino',
    },
  }

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Avvisi', href: '/avvisi' },
          { label: avviso.titolo },
        ]}
      />
      <header className={styles.header}>
        <h1>{avviso.titolo}</h1>
        <p className={styles.meta}>
          Pubblicato il{' '}
          <time dateTime={avviso.pubblicatoIl}>{formatData(avviso.pubblicatoIl)}</time>
          {scuole.length > 0 ? <> · {scuole.map((s) => s.nome).join(', ')}</> : null}
        </p>
        <ul className={styles.tags} aria-label="Categorie">
          {categorieAvviso(avviso).map((c) => (
            <li key={c.label}>
              <Tag href={c.href} tone={c.evidenza ? 'brand' : 'neutral'}>
                {c.label}
              </Tag>
            </li>
          ))}
        </ul>
      </header>

      {avviso.contenuto ? <RichText data={avviso.contenuto} className={styles.body} /> : null}

      <Attachments items={allegati} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </article>
  )
}
