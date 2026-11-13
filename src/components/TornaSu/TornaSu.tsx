'use client'

import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'react-aria-components'

import styles from './TornaSu.module.css'

/** Dopo quanti pixel di scorrimento compare il pulsante. */
const SOGLIA = 600

/**
 * Pulsante “Torna su” in basso a destra: compare dopo un po’ di scorrimento e riporta
 * all’inizio della pagina. Il focus va al contenuto principale, così chi usa la tastiera
 * o un lettore di schermo riparte dall’alto.
 */
export function TornaSu({ soglia = SOGLIA }: { soglia?: number }) {
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    const aggiorna = () => setVisibile(window.scrollY > soglia)
    aggiorna()
    window.addEventListener('scroll', aggiorna, { passive: true })
    return () => window.removeEventListener('scroll', aggiorna)
  }, [soglia])

  const vaiSu = () => {
    const ridotto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: ridotto ? 'auto' : 'smooth' })
    document.getElementById('contenuto')?.focus({ preventScroll: true })
  }

  return (
    <Button
      onPress={vaiSu}
      aria-label="Torna all’inizio della pagina"
      className={`${styles.pulsante} non-stampare`}
      data-visibile={visibile || undefined}
    >
      <ArrowUp size={22} strokeWidth={1.5} aria-hidden />
    </Button>
  )
}
