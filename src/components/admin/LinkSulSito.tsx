'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { ExternalLink } from 'lucide-react'

type Props = {
  /** Inizio dell'indirizzo pubblico, es. "/avvisi/". */
  prefisso?: string
  /** Campo con l'indirizzo: "slug" (default) o "percorso" per le pagine. */
  campo?: string
}

/**
 * In cima alla colonna laterale del documento: link diretto alla pagina pubblica,
 * per controllare il risultato senza navigare il sito. Compare solo dopo il primo salvataggio.
 */
export default function LinkSulSito({ prefisso = '/', campo = 'slug' }: Props) {
  const { id } = useDocumentInfo()
  const valore = useFormFields(([fields]) => fields[campo]?.initialValue)
  if (!id || typeof valore !== 'string' || !valore) return null
  const href = `${prefisso}${valore}`
  return (
    <div className="link-sul-sito">
      <a href={href} target="_blank" rel="noopener">
        <ExternalLink size={16} strokeWidth={1.5} aria-hidden />
        Vedi sul sito
        <span className="sr-only-pannello"> (si apre in una nuova scheda)</span>
      </a>
      <span className="link-sul-sito__indirizzo">{href}</span>
    </div>
  )
}
