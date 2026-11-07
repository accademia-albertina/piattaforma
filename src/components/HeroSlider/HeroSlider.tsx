'use client'

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'react-aria-components'

import { formatData } from '@/utilities/format'

import { useMediaQuery } from '../SiteHeader/hooks'

import styles from './HeroSlider.module.css'

export type HeroSlide = {
  titolo: string
  href: string
  data: string
  /** Immagine di sfondo, decorativa: il contenuto è nel titolo. */
  immagine?: { url: string; width?: number | null; height?: number | null } | null
}

/** Durata di ogni slide in riproduzione automatica (ms). */
const DURATA = 7000

const ICONA = { size: 18, strokeWidth: 1.5, 'aria-hidden': true } as const

/**
 * Slider degli avvisi in evidenza (schema "carousel" delle WAI-ARIA APG).
 * Scorre da solo, ma si ferma con il pulsante di pausa, al passaggio del mouse e quando
 * riceve il focus (WCAG 2.2.2); con "riduci movimento" parte già in pausa.
 */
export function HeroSlider({
  slides,
  label = 'Avvisi in evidenza',
}: {
  slides: HeroSlide[]
  label?: string
}) {
  const [attiva, setAttiva] = useState(0)
  // null = nessuna scelta dell'utente: decide la preferenza "riduci movimento"
  const [pausaScelta, setPausaScelta] = useState<boolean | null>(null)
  const riduciMovimento = useMediaQuery('(prefers-reduced-motion: reduce)', true)
  const inPausa = pausaScelta ?? riduciMovimento
  const [sospeso, setSospeso] = useState(false) // mouse sopra o focus dentro
  const touchX = useRef<number | null>(null)
  const totale = slides.length
  const automatico = totale > 1 && !inPausa && !sospeso

  useEffect(() => {
    if (!automatico) return
    const t = window.setTimeout(() => setAttiva((a) => (a + 1) % totale), DURATA)
    return () => window.clearTimeout(t)
  }, [automatico, attiva, totale])

  if (totale === 0) return null
  const vai = (i: number) => setAttiva((i + totale) % totale)

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={styles.slider}
      onMouseEnter={() => setSospeso(true)}
      onMouseLeave={() => setSospeso(false)}
      onFocus={() => setSospeso(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSospeso(false)
      }}
    >
      <div className={styles.sfondo} aria-hidden="true" />
      <div
        className={styles.track}
        // Mentre scorre da solo le slide non vengono annunciate (APG)
        aria-live={automatico ? 'off' : 'polite'}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 50) vai(attiva + (dx < 0 ? 1 : -1))
        }}
      >
        {slides.map((s, i) => {
          const visibile = i === attiva
          return (
            <div
              key={s.href}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} di ${totale}`}
              className={styles.slide}
              data-active={visibile || undefined}
              data-immagine={s.immagine?.url ? true : undefined}
              inert={!visibile}
              aria-hidden={!visibile}
            >
              {s.immagine?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- immagini dal CMS con dimensioni variabili
                <img
                  className={styles.image}
                  src={s.immagine.url}
                  alt=""
                  width={s.immagine.width ?? undefined}
                  height={s.immagine.height ?? undefined}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ) : null}
              <div className={`container ${styles.content}`}>
                <p className={styles.date}>
                  <time dateTime={s.data}>{formatData(s.data)}</time>
                </p>
                <h2 className={styles.title}>{s.titolo}</h2>
                <Link href={s.href} className="btn btn-chiaro">
                  Leggi l’avviso
                  <span className="visually-hidden">: {s.titolo}</span>
                  <ArrowRight aria-hidden />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {totale > 1 ? (
        <div className={`container ${styles.controls}`}>
          <ul className={styles.linee}>
            {slides.map((s, i) => (
              <li key={s.href}>
                <Button
                  className={styles.linea}
                  aria-label={`Avviso ${i + 1} di ${totale}`}
                  aria-current={i === attiva ? 'true' : undefined}
                  onPress={() => vai(i)}
                >
                  {i === attiva ? (
                    <span
                      key={attiva}
                      className={styles.avanzamento}
                      data-fermo={!automatico || undefined}
                      style={{ animationDuration: `${DURATA}ms` }}
                    />
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
          <div className={styles.comandi}>
            <p className={styles.contatore} aria-hidden="true">
              {attiva + 1} / {totale}
            </p>
            <Button
              className={styles.comando}
              aria-label={inPausa ? 'Avvia lo scorrimento' : 'Metti in pausa lo scorrimento'}
              onPress={() => setPausaScelta(!inPausa)}
            >
              {inPausa ? <Play {...ICONA} /> : <Pause {...ICONA} />}
            </Button>
            <Button
              className={styles.comando}
              aria-label="Avviso precedente"
              onPress={() => vai(attiva - 1)}
            >
              <ChevronLeft {...ICONA} />
            </Button>
            <Button
              className={styles.comando}
              aria-label="Avviso successivo"
              onPress={() => vai(attiva + 1)}
            >
              <ChevronRight {...ICONA} />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
