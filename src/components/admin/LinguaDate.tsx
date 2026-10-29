'use client'

import { it } from 'date-fns/locale/it'
import type { ReactNode } from 'react'
import { registerLocale, setDefaultLocale } from 'react-datepicker'

// Il selettore date di Payload imposta la lingua solo dopo il primo disegno,
// quindi il campo mostrava “28 Oct”: registrando l'italiano qui, prima che il
// pannello si disegni, le date compaiono subito come “28 ott”.
registerLocale('it', it)
setDefaultLocale('it')

export default function LinguaDate({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
