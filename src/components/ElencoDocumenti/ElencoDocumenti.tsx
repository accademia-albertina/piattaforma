import { Download, FileText, Image as IconaImmagine, Link2 } from 'lucide-react'

import { type Documento, formatoDocumento, hrefDocumento } from '@/lib/albo'
import { formatDimensione } from '@/utilities/format'
import { NUOVA_SCHEDA, apreNuovaScheda, attributiFile, tipoAnteprima } from '@/utilities/pdf'

import styles from './ElencoDocumenti.module.css'

/**
 * Documenti di un atto dell'Albo o di una sottosezione della trasparenza: nome, formato e,
 * se c'è, una nota. I documenti senza indirizzo non si mostrano. PDF e immagini del sito si
 * aprono nel visualizzatore, con il pulsante per scaricarli accanto.
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
    <ul className={styles.lista} data-compatto={compatto || undefined} data-anteprime="">
      {voci.map(({ d, href }, i) => {
        const file = d.file && typeof d.file === 'object' ? d.file : null
        const formato = formatoDocumento(href)
        const peso = file ? formatDimensione(file.filesize) : null
        const info = [formato, peso].filter(Boolean).join(' · ')
        const tipo = tipoAnteprima(href, file?.mimeType)
        const Icona = tipo === 'immagine' ? IconaImmagine : formato || tipo ? FileText : Link2
        return (
          <li key={`${href}-${i}`}>
            <div className={styles.riga}>
              <a
                href={href}
                className={styles.link}
                {...attributiFile(href, { mimeType: file?.mimeType, titolo: d.nome, info })}
              >
                <Icona size={18} strokeWidth={1.5} aria-hidden="true" className={styles.icona} />
                <span className={styles.nome}>
                  {d.nome}
                  {apreNuovaScheda(href, file?.mimeType) ? (
                    <span className="visually-hidden">{NUOVA_SCHEDA}</span>
                  ) : null}
                </span>
                {info ? <span className={styles.info}>{info}</span> : null}
              </a>
              {tipo ? (
                <a href={href} className={styles.scarica} download title="Scarica">
                  <Download size={18} strokeWidth={1.5} aria-hidden />
                  <span className="visually-hidden">Scarica {d.nome}</span>
                </a>
              ) : null}
            </div>
            {d.nota ? <p className={styles.nota}>{d.nota}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}
