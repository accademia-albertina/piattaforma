import { BookOpenText, LogOut } from 'lucide-react'
import Link from 'next/link'

/**
 * In fondo al menu laterale del pannello, al posto della sola icona di uscita di Payload:
 * “Guida” ed “Esci” con il nome scritto, perché un’icona da sola (“?”, freccia) non si capisce.
 */
export default function PiedeMenu() {
  return (
    <div className="piede-menu">
      <Link href="/admin/guida" className="piede-menu__voce">
        <BookOpenText size={20} strokeWidth={1.5} aria-hidden />
        Guida
      </Link>
      <Link href="/admin/logout" className="piede-menu__voce">
        <LogOut size={20} strokeWidth={1.5} aria-hidden />
        Esci
      </Link>
    </div>
  )
}
