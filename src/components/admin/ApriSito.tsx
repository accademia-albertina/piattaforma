import { Globe } from 'lucide-react'

/**
 * Pulsante nell'intestazione del pannello: apre il sito pubblico in una nuova scheda.
 * Il tema chiaro/scuro si sceglie dal proprio account (impostazione di Payload).
 */
export default function ApriSito() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener"
      className="azione-header"
      aria-label="Apri il sito (si apre in una nuova scheda)"
      title="Apri il sito"
    >
      <Globe size={20} strokeWidth={1.5} aria-hidden />
    </a>
  )
}
