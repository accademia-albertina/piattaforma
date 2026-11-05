import { House } from 'lucide-react'

/** Primo elemento del percorso nel pannello: la casetta riporta alla bacheca. */
export default function Icon() {
  return (
    <span className="icona-bacheca">
      <House size={20} strokeWidth={1.5} aria-hidden />
      <span className="sr-only-pannello">Bacheca</span>
    </span>
  )
}
