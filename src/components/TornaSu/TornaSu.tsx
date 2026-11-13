'use client'

import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'react-aria-components'

import styles from './TornaSu.module.css'

/** Oltre questa distanza dall'alto (in px) compare il pulsante. */
const SOGLIA = 600

/**
 * Pulsante “Torna su”, fisso in basso a destra: compare dopo aver scorso la pagina.
 * Riporta in cima e sposta il focus sul contenuto, così chi usa la tastiera riparte da lì.
 */
export function TornaSu({ sempreVisibile = false }: { sempreVisibile?: boolean }) {
  const [visibile, setVisibile] = useState(sempreVisibile)

  useEffect(() => {
    if (sempreVisibile) return
    const onScroll = () => setVisibile(window.scrollY > SOGLIA)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sempreVisibile])

  const tornaSu = () => {
    const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: ridotto ? 'auto' : 'smooth' })
    document.getElementById('contenuto')?.focus({ preventScroll: true })
  }

  return (
    // Nascosto è "inert": niente focus da tastiera né lettura dai lettori di schermo
    <div className={`${styles.contenitore} non-stampare`} inert={!visibile}>
      <Button
        className={styles.pulsante}
        onPress={tornaSu}
        aria-label="Torna su"
        data-visibile={visibile || undefined}
      >
        <ArrowUp size={22} strokeWidth={1.5} aria-hidden />
      </Button>
    </div>
  )
}
