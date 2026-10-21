import { formatDimensione, formatTipoFile } from '@/utilities/format'

import styles from './Attachments.module.css'

export type Allegato = {
  nome: string
  url: string
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
}

/** Elenco degli allegati con formato e peso, come richiesto dalle linee guida AGID. */
export function Attachments({ items, title = 'Allegati' }: { items: Allegato[]; title?: string }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="allegati-titolo" className={styles.section}>
      <h2 id="allegati-titolo" className={styles.title}>
        {title}
      </h2>
      <ul className={styles.list}>
        {items.map((a) => {
          const info = [
            formatTipoFile(a.mimeType, a.filename),
            formatDimensione(a.filesize),
          ].filter(Boolean)
          return (
            <li key={a.url}>
              <a href={a.url} className={styles.link} download>
                <span className={styles.name}>{a.nome}</span>
                {info.length > 0 ? <span className={styles.info}>{info.join(' · ')}</span> : null}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
