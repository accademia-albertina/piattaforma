import { Globe } from 'lucide-react'

/**
 * Pulsante nell'intestazione del pannello: apre il sito pubblico in una nuova scheda.
 * Come nell'header del sito: icona, etichetta sotto (da computer) e filetto animato al
 * passaggio. Il tema chiaro/scuro si sceglie dal proprio account (impostazione di Payload).
 */
export default function ApriSito() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener"
      className="azione-header"
      aria-label="Sito (si apre in una nuova scheda)"
    >
      <Globe size={20} strokeWidth={1.5} aria-hidden />
      <span className="azione-header__etichetta" aria-hidden>
        Sito
      </span>
    </a>
  )
}
