'use client'

import { type ReactNode, useEffect } from 'react'

const PREFISSO = 'Cerca per '

/**
 * "Cerca per Chi, Email Oppure Elemento" → "Cerca per chi, email o elemento".
 * Payload compone il segnaposto della ricerca con le etichette dei campi (maiuscole perché
 * sono anche i titoli delle colonne) e con "Oppure": qui lo si riscrive in italiano piano.
 * Le sigle (ID, PDF, CSV…) restano maiuscole.
 */
export function segnapostoNaturale(testo: string): string {
  if (!testo.startsWith(PREFISSO)) return testo
  const resto = testo
    .slice(PREFISSO.length)
    .replace(/ Oppure /g, ' o ')
    .split(/(\s+|,)/)
    .map((parola) =>
      parola.length > 1 && parola === parola.toUpperCase() ? parola : parola.toLowerCase(),
    )
    .join('')
  return PREFISSO + resto
}

function correggi(input: Element) {
  const attuale = input.getAttribute('placeholder')
  if (!attuale) return
  const giusto = segnapostoNaturale(attuale)
  if (giusto !== attuale) input.setAttribute('placeholder', giusto)
}

export default function RicercaInMinuscolo({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const selettore = '#search-filter-input'
    document.querySelectorAll(selettore).forEach(correggi)
    // Il campo ricompare a ogni cambio di elenco e Payload riscrive il segnaposto
    const osservatore = new MutationObserver((mutazioni) => {
      for (const m of mutazioni) {
        if (m.type === 'attributes' && m.target instanceof Element && m.target.matches(selettore)) {
          correggi(m.target)
        } else if (m.type === 'childList' && m.addedNodes.length) {
          document.querySelectorAll(selettore).forEach(correggi)
        }
      }
    })
    osservatore.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['placeholder'],
    })
    return () => osservatore.disconnect()
  }, [])
  return <>{children}</>
}
