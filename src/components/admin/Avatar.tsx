import { CircleUserRound } from 'lucide-react'

/**
 * Icona dell'account nell'intestazione del pannello, al posto del disco grigio di Payload:
 * stessa misura, etichetta e filetto del pulsante "Sito". Il collegamento intorno (con il
 * nome accessibile "Account") è di Payload.
 */
export default function Avatar() {
  return (
    <span className="azione-header azione-header--account">
      <CircleUserRound size={20} strokeWidth={1.5} aria-hidden />
      <span className="azione-header__etichetta" aria-hidden>
        Account
      </span>
    </span>
  )
}
