import { CircleHelp } from 'lucide-react'
import Link from 'next/link'

/** Pulsante nell'intestazione del pannello: apre la guida del proprio ruolo. */
export default function ApriGuida() {
  return (
    <Link href="/admin/guida" className="azione-header" aria-label="Guida" title="Guida">
      <CircleHelp size={20} strokeWidth={1.5} aria-hidden />
    </Link>
  )
}
