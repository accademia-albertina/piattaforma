'use client'

import { Minus, Plus } from 'lucide-react'
import { type ReactNode, type RefObject, useEffect, useRef } from 'react'
import { Button } from 'react-aria-components'

import styles from './Visualizzatore.module.css'

/** Livelli di zoom proposti da − e + (1 = 100%). */
export const LIVELLI_ZOOM = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 3, 4] as const
export const ZOOM_MIN = LIVELLI_ZOOM[0]
export const ZOOM_MAX = LIVELLI_ZOOM[LIVELLI_ZOOM.length - 1]

/** Livello successivo (verso = 1) o precedente (verso = -1) rispetto a quello attuale. */
export function zoomVicino(attuale: number, verso: 1 | -1): number {
  if (verso === 1) return LIVELLI_ZOOM.find((z) => z > attuale + 0.001) ?? ZOOM_MAX
  return [...LIVELLI_ZOOM].reverse().find((z) => z < attuale - 0.001) ?? ZOOM_MIN
}

export function percentuale(scala: number) {
  return `${Math.round(scala * 100)}%`
}

/** Pulsante con sola icona: il nome per i lettori di schermo è in `etichetta`. */
export function PulsanteIcona({
  etichetta,
  onPress,
  isDisabled,
  children,
  className,
}: {
  etichetta: string
  onPress: () => void
  isDisabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <Button
      className={`${styles.pulsante} ${className ?? ''}`}
      onPress={onPress}
      isDisabled={isDisabled}
      aria-label={etichetta}
    >
      {children}
    </Button>
  )
}

/** − 100% +: il valore al centro riporta la vista ad «adatta». */
export function ControlliZoom({
  scala,
  adatta,
  onZoom,
  onAdatta,
}: {
  scala: number
  /** La vista è già adattata allo spazio disponibile? */
  adatta: boolean
  onZoom: (nuova: number) => void
  onAdatta: () => void
}) {
  return (
    <div className={`${styles.gruppo} ${styles.gruppoZoom}`} role="group" aria-label="Zoom">
      <PulsanteIcona
        etichetta="Riduci"
        onPress={() => onZoom(zoomVicino(scala, -1))}
        isDisabled={scala <= ZOOM_MIN + 0.001}
      >
        <Minus size={20} strokeWidth={1.75} aria-hidden />
      </PulsanteIcona>
      <Button
        className={`${styles.pulsante} ${styles.valoreZoom}`}
        onPress={onAdatta}
        isDisabled={adatta}
        aria-label={`Zoom ${percentuale(scala)}${adatta ? '' : ': adatta allo schermo'}`}
      >
        {percentuale(scala)}
      </Button>
      <PulsanteIcona
        etichetta="Ingrandisci"
        onPress={() => onZoom(zoomVicino(scala, 1))}
        isDisabled={scala >= ZOOM_MAX - 0.001}
      >
        <Plus size={20} strokeWidth={1.75} aria-hidden />
      </PulsanteIcona>
    </div>
  )
}

/**
 * Barra del visualizzatore. Sul computer è una riga sola (titolo, comandi, azioni, chiudi);
 * sul telefono il titolo resta in alto e comandi e azioni scendono in basso, a portata di
 * pollice. Le aree le dispone la griglia di .vista (Visualizzatore.module.css).
 */
export function Barra({
  titolo,
  comandi,
  azioni,
  chiudi,
}: {
  titolo: ReactNode
  comandi?: ReactNode
  azioni?: ReactNode
  chiudi?: ReactNode
}) {
  return (
    <>
      <div className={styles.areaTitolo}>{titolo}</div>
      {chiudi ? <div className={styles.areaChiudi}>{chiudi}</div> : null}
      <div className={styles.areaStrumenti}>
        {comandi ? <div className={styles.comandi}>{comandi}</div> : null}
        {azioni ? <div className={styles.azioni}>{azioni}</div> : null}
      </div>
    </>
  )
}

export type PuntoPizzico = {
  /** Punto del pizzico nel contenuto (px, prima dello zoom). */
  cx: number
  cy: number
  /** Lo stesso punto nella parte visibile (px dal bordo del contenitore). */
  vx: number
  vy: number
}

/**
 * Zoom col pizzico a due dita (telefono e tablet). Durante il gesto il contenuto si
 * ingrandisce con una trasformazione CSS (fluida, senza ridisegnare); alla fine `applica`
 * riceve il nuovo zoom e il punto da tenere fermo, e il componente ridisegna nitido.
 * Sul telefono sostituisce i pulsanti − e +.
 */
export function usePizzico(
  scorrimento: RefObject<HTMLElement | null>,
  contenuto: RefObject<HTMLElement | null>,
  scala: number,
  applica: (nuova: number, punto: PuntoPizzico) => void,
  attivo = true,
) {
  const ultimi = useRef({ scala, applica })
  useEffect(() => {
    ultimi.current = { scala, applica }
  })

  useEffect(() => {
    const el = scorrimento.current
    if (!el || !attivo) return
    let inizio: { d: number; scala: number; punto: PuntoPizzico } | null = null
    let rapporto = 1
    const distanza = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const box = el.getBoundingClientRect()
      const vx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - box.left
      const vy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - box.top
      inizio = {
        d: distanza(e.touches),
        scala: ultimi.current.scala,
        punto: { cx: vx + el.scrollLeft, cy: vy + el.scrollTop, vx, vy },
      }
      rapporto = 1
    }
    const onMove = (e: TouchEvent) => {
      if (!inizio || e.touches.length !== 2) return
      e.preventDefault()
      const grezzo = distanza(e.touches) / inizio.d
      const nuova = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, inizio.scala * grezzo))
      rapporto = nuova / inizio.scala
      const c = contenuto.current
      if (c) {
        c.style.transformOrigin = `${inizio.punto.cx - c.offsetLeft}px ${inizio.punto.cy - c.offsetTop}px`
        c.style.transform = `scale(${rapporto})`
      }
    }
    const onEnd = (e: TouchEvent) => {
      if (!inizio || e.touches.length >= 2) return
      const c = contenuto.current
      if (c) {
        c.style.transform = ''
        c.style.transformOrigin = ''
      }
      const { scala: s, punto } = inizio
      inizio = null
      if (Math.abs(rapporto - 1) > 0.02) ultimi.current.applica(s * rapporto, punto)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [scorrimento, contenuto, attivo])
}
