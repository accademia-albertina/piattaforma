import Link from 'next/link'

import { Tag } from '../Tag/Tag'
import { formatData } from '@/utilities/format'

import styles from './AvvisoCard.module.css'

export type AvvisoCardProps = {
  titolo: string
  href: string
  data: string
  categorie: { label: string; href?: string; evidenza?: boolean }[]
  sommario?: string
  /** Livello del titolo, per rispettare la gerarchia della pagina che ospita la card. */
  headingLevel?: 2 | 3
}

export function AvvisoCard({
  titolo,
  href,
  data,
  categorie,
  sommario,
  headingLevel = 2,
}: AvvisoCardProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <article className={styles.card}>
      <Heading className={styles.title}>
        <Link href={href} className={styles.link}>
          {titolo}
        </Link>
      </Heading>
      <p className={styles.meta}>
        <time dateTime={data}>{formatData(data)}</time>
      </p>
      {sommario ? <p className={styles.summary}>{sommario}</p> : null}
      {categorie.length > 0 ? (
        <ul className={styles.tags} aria-label="Categorie">
          {categorie.map((c) => (
            <li key={c.label}>
              <Tag href={c.href} tone={c.evidenza ? 'brand' : 'neutral'}>
                {c.label}
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
