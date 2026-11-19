'use client'

import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import {
  Barra,
  ControlliZoom,
  type PuntoPizzico,
  ZOOM_MIN,
  usePizzico,
  zoomVicino,
} from './strumenti'
import styles from './Visualizzatore.module.css'

const MARGINE = 24

/**
 * Immagine a tutto schermo: si adatta allo spazio, con lo zoom si ingrandisce e si sposta
 * trascinandola (col mouse) o scorrendo. Un clic passa da «adatta» a 100% e viceversa.
 */
export function VistaImmagine({
  url,
  nome,
  titolo,
  azioni,
  chiudi,
  alternativa,
}: {
  url: string
  nome: string
  titolo: ReactNode
  azioni?: ReactNode
  chiudi?: ReactNode
  alternativa?: ReactNode
}) {
  const scorrimento = useRef<HTMLDivElement>(null)
  const [naturale, setNaturale] = useState<{ w: number; h: number } | null>(null)
  const [spazio, setSpazio] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState<number | 'adatta'>('adatta')
  const [errore, setErrore] = useState(false)
  const centro = useRef<{ x: number; y: number } | null>(null)
  const pizzico = useRef<(PuntoPizzico & { da: number }) | null>(null)
  const cornice = useRef<HTMLDivElement>(null)
  const trascina = useRef<{ x: number; y: number; sx: number; sy: number; mosso: boolean } | null>(
    null,
  )

  useEffect(() => {
    const el = scorrimento.current
    if (!el) return
    const ro = new ResizeObserver(() => setSpazio({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scalaAdatta = naturale
    ? Math.max(
        ZOOM_MIN,
        Math.min(1, (spazio.w - 2 * MARGINE) / naturale.w, (spazio.h - 2 * MARGINE) / naturale.h),
      )
    : 1
  const scala = zoom === 'adatta' ? scalaAdatta : zoom

  const cambiaZoom = useCallback((nuovo: number | 'adatta') => {
    const el = scorrimento.current
    if (el) {
      centro.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setZoom(nuovo)
  }, [])

  // Con lo zoom resta al centro lo stesso punto dell'immagine
  useLayoutEffect(() => {
    const el = scorrimento.current
    const pz = pizzico.current
    if (pz && el) {
      pizzico.current = null
      const r = scala / pz.da
      el.scrollLeft = pz.cx * r - pz.vx
      el.scrollTop = pz.cy * r - pz.vy
      return
    }
    const c = centro.current
    if (!el || !c) return
    centro.current = null
    el.scrollLeft = c.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = c.y * el.scrollHeight - el.clientHeight / 2
  }, [scala])

  useEffect(() => {
    const el = scorrimento.current
    if (!el || !naturale) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      cambiaZoom(zoomVicino(scala, e.deltaY < 0 ? 1 : -1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [naturale, scala, cambiaZoom])

  usePizzico(
    scorrimento,
    cornice,
    scala,
    (nuova, punto) => {
      pizzico.current = { ...punto, da: scala }
      setZoom(nuova)
    },
    Boolean(naturale),
  )

  const ingrandibile = scalaAdatta < 1
  const alternaZoom = () => {
    if (zoom === 'adatta') {
      if (ingrandibile) cambiaZoom(1)
    } else cambiaZoom('adatta')
  }

  const onTasto = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === '+' || e.key === '=') cambiaZoom(zoomVicino(scala, 1))
    else if (e.key === '-') cambiaZoom(zoomVicino(scala, -1))
    else if (e.key === '0') cambiaZoom('adatta')
    else return
    e.preventDefault()
  }

  // Trascinamento col mouse quando l'immagine è più grande dello spazio
  const onPointerDown = (e: React.PointerEvent) => {
    const el = scorrimento.current
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
    trascina.current = {
      x: e.clientX,
      y: e.clientY,
      sx: el.scrollLeft,
      sy: el.scrollTop,
      mosso: false,
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const t = trascina.current
    const el = scorrimento.current
    if (!t || !el) return
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y
    if (Math.abs(dx) + Math.abs(dy) > 4) t.mosso = true
    el.scrollLeft = t.sx - dx
    el.scrollTop = t.sy - dy
  }
  const onPointerUp = () => {
    const t = trascina.current
    trascina.current = null
    if (t && !t.mosso) alternaZoom()
  }

  const comandi = naturale ? (
    <ControlliZoom
      scala={scala}
      adatta={zoom === 'adatta'}
      onZoom={cambiaZoom}
      onAdatta={() => cambiaZoom('adatta')}
    />
  ) : null

  const zoomato = zoom !== 'adatta' && scala > scalaAdatta + 0.001
  return (
    <div className={styles.vista}>
      <Barra titolo={titolo} comandi={comandi} azioni={azioni} chiudi={chiudi} />
      {/* Contenitore scorrevole raggiungibile da tastiera (WCAG 2.1.1), con le scorciatoie dello zoom */}
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={scorrimento}
        className={`${styles.contenuto} ${styles.contenutoImmagine}`}
        tabIndex={0}
        role="region"
        aria-label={`Immagine: ${nome}`}
        onKeyDown={onTasto}
      >
        {errore ? (
          <div className={styles.messaggio} role="alert">
            <p>Non è stato possibile mostrare l’immagine.</p>
            {alternativa}
          </div>
        ) : (
          <div
            ref={cornice}
            className={styles.cornice}
            data-cursore={zoomato ? 'riduci' : ingrandibile ? 'ingrandisci' : undefined}
            style={naturale ? { width: naturale.w * scala, height: naturale.h * scala } : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (trascina.current = null)}
          >
            {/* Immagine originale, senza ottimizzazione: serve la risoluzione piena per lo zoom */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={nome}
              draggable={false}
              onLoad={(e) =>
                setNaturale({
                  w: e.currentTarget.naturalWidth || 800,
                  h: e.currentTarget.naturalHeight || 600,
                })
              }
              onError={() => setErrore(true)}
              data-caricata={naturale ? true : undefined}
            />
          </div>
        )}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
    </div>
  )
}
