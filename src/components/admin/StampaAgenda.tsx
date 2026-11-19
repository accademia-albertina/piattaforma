'use client'

import { Printer } from 'lucide-react'

/** Stampa l'elenco del giorno (il CSS di stampa nasconde menu e pulsanti). */
export default function StampaAgenda() {
  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-small btn--icon-position-left"
      onClick={() => window.print()}
    >
      <Printer size={16} strokeWidth={1.5} aria-hidden /> Stampa
    </button>
  )
}
