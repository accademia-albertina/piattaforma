import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConvertersFunction,
  RichText,
} from '@payloadcms/richtext-lexical/react'
import { Fragment } from 'react'

import { dividiLink } from '@/utilities/autolink'

// Gli avvisi importati da WordPress hanno gli indirizzi scritti come testo:
// qui diventano link, a meno che non siano già dentro un link.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
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
            <a key={i} href={p.href} rel={p.href.startsWith('http') ? 'noopener' : undefined}>
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
  return <RichText data={data as SerializedEditorState} className={className} converters={converters} />
}
