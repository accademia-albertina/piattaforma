import { CircleUserRound } from 'lucide-react'

/**
 * Icona dell'account nell'intestazione del pannello: stesso tratto e stessa misura
 * dell'icona "Apri il sito", al posto del disco grigio di Payload.
 */
export default function Avatar() {
  return (
    <span className="icona-account">
      <CircleUserRound size={22} strokeWidth={1.5} aria-hidden />
    </span>
  )
}
