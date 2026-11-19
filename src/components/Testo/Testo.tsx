import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react'
import { Fragment } from 'react'

import { IconaScuola } from '@/components/IconaScuola/IconaScuola'
import { dividiLink } from '@/utilities/autolink'
import { slugScuolaDaLink } from '@/utilities/linkScuola'
import { attributiFile, isPdf, tipoAnteprima } from '@/utilities/pdf'

import styles from './Testo.module.css'

// Gli avvisi importati da WordPress hanno gli indirizzi scritti come testo:
// qui diventano link, a meno che non siano già dentro un link.
// I link a PDF e immagini del sito si aprono nel visualizzatore; i PDF di altri siti in una
// nuova scheda (impostazione “nuova scheda” forzata).

/** Link a un file del sito che si apre nel visualizzatore: niente nuova scheda. */
function linkAnteprima(href: string | undefined, children: React.ReactNode) {
  if (!href || !tipoAnteprima(href)) return null
  return (
    <a href={href} {...attributiFile(href)}>
      {children}
    </a>
  )
}
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Tabelle con i nostri stili (non quelli in linea di Payload) e intestazioni con scope:
  // la prima riga di intestazione vale per le colonne, la prima colonna per le righe.
  table: ({ node, nodesToJSX }) => (
    // Contenitore scorrevole raggiungibile da tastiera (WCAG 2.1.1)
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className={styles.tabella} tabIndex={0} role="region" aria-label="Tabella">
      <table>
        <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
      </table>
    </div>
  ),
  tablerow: ({ node, nodesToJSX }) => <tr>{nodesToJSX({ nodes: node.children })}</tr>,
  tablecell: ({ node, nodesToJSX }) => {
    const stato = typeof node.headerState === 'number' ? node.headerState : 0
    const props = {
      colSpan: node.colSpan && node.colSpan > 1 ? node.colSpan : undefined,
      rowSpan: node.rowSpan && node.rowSpan > 1 ? node.rowSpan : undefined,
      children: nodesToJSX({ nodes: node.children }),
    }
    if (stato & 1) return <th scope="col" {...props} />
    if (stato & 2) return <th scope="row" {...props} />
    return <td {...props} />
  },
  link: (args) => {
    const base = defaultConverters.link
    if (typeof base !== 'function') return null
    // Link a una scuola (anche col vecchio indirizzo WordPress): pagina nuova e icona della scuola
    const scuola =
      args.node.fields?.linkType !== 'internal' && slugScuolaDaLink(args.node.fields?.url)
    if (scuola) {
      return (
        <a href={`/scuole/${scuola}`} className={styles.linkScuola}>
          <IconaScuola scuola={scuola} size={28} className={styles.iconaScuola} />
          <span>{args.nodesToJSX({ nodes: args.node.children })}</span>
        </a>
      )
    }
    const anteprima =
      args.node.fields?.linkType !== 'internal' &&
      linkAnteprima(args.node.fields?.url, args.nodesToJSX({ nodes: args.node.children }))
    if (anteprima) return anteprima
    const pdf = isPdf(args.node.fields?.url)
    return base(
      pdf
        ? { ...args, node: { ...args.node, fields: { ...args.node.fields, newTab: true } } }
        : args,
    )
  },
  autolink: (args) => {
    const base = defaultConverters.autolink
    if (typeof base !== 'function') return null
    const anteprima = linkAnteprima(
      args.node.fields?.url,
      args.nodesToJSX({ nodes: args.node.children }),
    )
    if (anteprima) return anteprima
    const pdf = isPdf(args.node.fields?.url)
    return base(
      pdf
        ? { ...args, node: { ...args.node, fields: { ...args.node.fields, newTab: true } } }
        : args,
    )
  },
  // File caricati nel testo: le immagini si ingrandiscono nel visualizzatore,
  // PDF e altri file diventano link con il nome del file.
  upload: (args) => {
    const base = defaultConverters.upload
    const doc = args.node.value as {
      url?: string | null
      mimeType?: string | null
      filename?: string | null
      alt?: string | null
    } | null
    if (typeof doc !== 'object' || !doc?.url) return null
    const mime = typeof doc.mimeType === 'string' ? doc.mimeType : null
    const nome = (typeof doc.filename === 'string' && doc.filename) || 'File'
    if (!mime?.startsWith('image')) {
      return (
        <a
          href={doc.url}
          {...attributiFile(doc.url, {
            mimeType: mime,
            scarica: true,
            titolo: nome,
            filename: nome,
          })}
        >
          {nome}
        </a>
      )
    }
    const alt = (args.node.fields?.alt as string | undefined) || doc.alt || ''
    return (
      <a
        href={doc.url}
        className={styles.ingrandisci}
        aria-label={`Ingrandisci: ${alt || nome}`}
        {...attributiFile(doc.url, { mimeType: mime, titolo: alt || nome, filename: nome })}
      >
        {typeof base === 'function' ? base(args) : null}
      </a>
    )
  },
  text: (args) => {
    const base = defaultConverters.text
    const render = (testo: string) =>
      typeof base === 'function' ? base({ ...args, node: { ...args.node, text: testo } }) : testo
    const tipoGenitore = (args.parent as { type?: string } | undefined)?.type
    if (tipoGenitore === 'link' || tipoGenitore === 'autolink') return render(args.node.text)
    const pezzi = dividiLink(args.node.text)
    if (pezzi.length === 1 && pezzi[0].tipo === 'testo') return render(args.node.text)
    return (
      <>
        {pezzi.map((p, i) =>
          p.tipo === 'link' ? (
            tipoAnteprima(p.href) ? (
              <a key={i} href={p.href} {...attributiFile(p.href)}>
                {render(p.testo)}
              </a>
            ) : (
              <a
                key={i}
                href={p.href}
                rel={p.href.startsWith('http') || isPdf(p.href) ? 'noopener' : undefined}
                target={isPdf(p.href) ? '_blank' : undefined}
              >
                {render(p.testo)}
              </a>
            )
          ) : (
            <Fragment key={i}>{render(p.testo)}</Fragment>
          ),
        )}
      </>
    )
  },
})

type Props = { data: SerializedEditorState | Record<string, unknown>; className?: string }

/** Testo ricco del sito: come RichText di Payload, con gli indirizzi resi cliccabili. */
export function Testo({ data, className }: Props) {
  return (
    <RichText
      data={data as SerializedEditorState}
      className={`${styles.testo} ${className ?? ''}`}
      converters={converters}
    />
  )
}
