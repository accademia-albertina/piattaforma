import { Download, File, FileText, Image as IconaImmagine } from 'lucide-react'

import { formatDimensione, formatTipoFile } from '@/utilities/format'
import { NUOVA_SCHEDA, apreNuovaScheda, attributiFile, tipoAnteprima } from '@/utilities/pdf'

import styles from './Attachments.module.css'

export type Allegato = {
  nome: string
  url: string
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
}

/**
 * Elenco degli allegati con formato e peso, come richiesto dalle linee guida AGID.
 * PDF e immagini si aprono nel visualizzatore del sito (e si sfogliano con le frecce);
 * accanto c'è sempre il pulsante per scaricarli. Gli altri file si scaricano col clic.
 */
export function Attachments({
  items,
  title = 'Allegati',
  id = 'allegati-titolo',
}: {
  items: Allegato[]
  title?: string
  /** Da cambiare se nella pagina ci sono più elenchi di allegati. */
  id?: string
}) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby={id} className={styles.section}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      <ul className={styles.list} data-anteprime="">
        {items.map((a) => {
          const info = [
            formatTipoFile(a.mimeType, a.filename),
            formatDimensione(a.filesize),
          ].filter(Boolean)
          const tipo = tipoAnteprima(a.url, a.mimeType)
          const Icona = tipo === 'immagine' ? IconaImmagine : tipo === 'pdf' ? FileText : File
          return (
            <li key={a.url} className={styles.item}>
              <a
                href={a.url}
                className={styles.link}
                {...attributiFile(a.url, {
                  mimeType: a.mimeType,
                  scarica: true,
                  titolo: a.nome,
                  filename: a.filename,
                  info: info.join(' · '),
                })}
              >
                <Icona size={20} strokeWidth={1.5} aria-hidden className={styles.icona} />
                <span className={styles.name}>{a.nome}</span>
                {apreNuovaScheda(a.url, a.mimeType) ? (
                  <span className="visually-hidden">{NUOVA_SCHEDA}</span>
                ) : null}
                {info.length > 0 ? <span className={styles.info}>{info.join(' · ')}</span> : null}
              </a>
              {tipo ? (
                <a
                  href={a.url}
                  className={styles.scarica}
                  download={a.filename || true}
                  title="Scarica"
                >
                  <Download size={20} strokeWidth={1.5} aria-hidden />
                  <span className="visually-hidden">Scarica {a.nome}</span>
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
