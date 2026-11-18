'use client'

import { type ReactNode, useEffect } from 'react'

/**
 * Su telefono il menu del pannello si apre come cassetto sopra la pagina, con un velo scuro
 * dietro. Payload lo chiude solo dalla X: qui un tocco sul velo (fuori dal cassetto) lo chiude,
 * come ci si aspetta da un menu laterale. Si "preme" la X di Payload, così lo stato resta suo.
 */
export function toccoFuoriDalMenu(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (!document.querySelector('.nav--nav-open')) return false
  // Dentro il cassetto, sul pulsante che lo apre o in un popup sopra: non si chiude
  return !target.closest('.nav, .app-header__mobile-nav-toggler, .popup, .drawer, [role="dialog"]')
}

export default function ChiudiMenuFuori({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const alTocco = (e: MouseEvent) => {
      if (!window.matchMedia('(max-width: 768px)').matches) return
      if (!toccoFuoriDalMenu(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      document.querySelector<HTMLButtonElement>('.nav__mobile-close')?.click()
    }
    // In cattura: il tocco sul velo non deve aprire anche il collegamento che c'è sotto
    document.addEventListener('click', alTocco, true)
    return () => document.removeEventListener('click', alTocco, true)
  }, [])
  return <>{children}</>
}
