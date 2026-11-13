import { FileText, Link2 } from 'lucide-react'

import { type Documento, formatoDocumento, hrefDocumento } from '@/lib/albo'
import { formatDimensione } from '@/utilities/format'
import { NUOVA_SCHEDA, attributiFile, isPdf } from '@/utilities/pdf'

import styles from './ElencoDocumenti.module.css'

/**
 * Documenti di un atto dell'Albo o di una sottosezione della trasparenza: nome, formato e,
 * se c'è, una nota. I documenti senza indirizzo non si mostrano.
 */
export function ElencoDocumenti({
  documenti,
  compatto = false,
}: {
  documenti: Documento[]
  /** Righe più strette, per gli elenchi di atti. */
  compatto?: boolean
}) {
  const voci = documenti
    .map((d) => ({ d, href: hrefDocumento(d) }))
    .filter((v): v is { d: Documento; href: string } => Boolean(v.href))
  if (voci.length === 0) return null
  return (
    <ul className={styles.lista} data-compatto={compatto || undefined}>
      {voci.map(({ d, href }, i) => {
        const formato = formatoDocumento(href)
        const peso = d.file && typeof d.file === 'object' ? formatDimensione(d.file.filesize) : null
        const info = [formato, peso].filter(Boolean).join(' · ')
        const Icona = formato ? FileText : Link2
        return (
          <li key={`${href}-${i}`}>
            <a href={href} className={styles.link} {...attributiFile(href)}>
              <Icona size={18} strokeWidth={1.5} aria-hidden="true" className={styles.icona} />
              <span className={styles.nome}>
                {d.nome}
                {isPdf(href) ? <span className="visually-hidden">{NUOVA_SCHEDA}</span> : null}
              </span>
              {info ? <span className={styles.info}>{info}</span> : null}
            </a>
            {d.nota ? <p className={styles.nota}>{d.nota}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}
