import { formatDimensione, formatTipoFile } from '@/utilities/format'
import { NUOVA_SCHEDA, attributiFile, isPdf } from '@/utilities/pdf'

import styles from './Attachments.module.css'

export type Allegato = {
  nome: string
  url: string
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
}

/** Elenco degli allegati con formato e peso, come richiesto dalle linee guida AGID. */
export function Attachments({
  items,
  title = 'Allegati',
  id = 'allegati-titolo',
  livello = 2,
}: {
  items: Allegato[]
  title?: string
  /** Livello del titolo: 2 nella pagina, più basso dentro una sezione (es. una fisarmonica). */
  livello?: 2 | 3 | 4 | 5
  /** Da cambiare se nella pagina ci sono più elenchi di allegati. */
  id?: string
}) {
  if (items.length === 0) return null
  const Titolo = `h${livello}` as const
  return (
    <section aria-labelledby={id} className={styles.section}>
      <Titolo id={id} className={styles.title}>
        {title}
      </Titolo>
      <ul className={styles.list}>
        {items.map((a) => {
          const info = [
            formatTipoFile(a.mimeType, a.filename),
            formatDimensione(a.filesize),
          ].filter(Boolean)
          return (
            <li key={a.url}>
              <a
                href={a.url}
                className={styles.link}
                {...attributiFile(a.url, { mimeType: a.mimeType, scarica: true })}
              >
                <span className={styles.name}>{a.nome}</span>
                {isPdf(a.url, a.mimeType) ? (
                  <span className="visually-hidden">{NUOVA_SCHEDA}</span>
                ) : null}
                {info.length > 0 ? <span className={styles.info}>{info.join(' · ')}</span> : null}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
