import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react'
import { Fragment } from 'react'

import { IconaScuola } from '@/components/IconaScuola/IconaScuola'
import { dividiLink } from '@/utilities/autolink'
import { slugScuolaDaLink } from '@/utilities/linkScuola'
import { isPdf } from '@/utilities/pdf'

import styles from './Testo.module.css'

// Gli avvisi importati da WordPress hanno gli indirizzi scritti come testo:
// qui diventano link, a meno che non siano già dentro un link.
// I link ai PDF si aprono in una nuova scheda (impostazione “nuova scheda” forzata).
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
    const pdf = isPdf(args.node.fields?.url)
    return base(
      pdf
        ? { ...args, node: { ...args.node, fields: { ...args.node.fields, newTab: true } } }
        : args,
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
            <a
              key={i}
              href={p.href}
              rel={p.href.startsWith('http') || isPdf(p.href) ? 'noopener' : undefined}
              target={isPdf(p.href) ? '_blank' : undefined}
            >
              {render(p.testo)}
            </a>
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
