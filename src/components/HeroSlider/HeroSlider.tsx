'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Button } from 'react-aria-components'

import { formatData } from '@/utilities/format'

import styles from './HeroSlider.module.css'

export type HeroSlide = {
  titolo: string
  href: string
  data: string
  /** Immagine di sfondo, decorativa: il contenuto è nel titolo. */
  immagine?: { url: string; width?: number | null; height?: number | null } | null
}

/**
 * Slider degli avvisi in evidenza (schema "carousel" delle WAI-ARIA APG).
 * Niente scorrimento automatico: si cambia slide solo con i comandi o lo swipe (WCAG 2.2.2).
 */
export function HeroSlider({
  slides,
  label = 'Avvisi in evidenza',
}: {
  slides: HeroSlide[]
  label?: string
}) {
  const [attiva, setAttiva] = useState(0)
  const touchX = useRef<number | null>(null)
  const totale = slides.length
  if (totale === 0) return null
  const vai = (i: number) => setAttiva((i + totale) % totale)

  return (
    <section aria-roledescription="carousel" aria-label={label} className={styles.slider}>
      <div
        className={styles.track}
        aria-live="polite"
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
                <Link href={s.href} className={styles.cta}>
                  Leggi l’avviso<span aria-hidden="true">→</span>
                  <span className="visually-hidden">: {s.titolo}</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {totale > 1 ? (
        <div className={`container ${styles.controls}`}>
          <Button
            className={styles.arrow}
            aria-label="Avviso precedente"
            onPress={() => vai(attiva - 1)}
          >
            <span aria-hidden="true">←</span>
          </Button>
          <ul className={styles.dots}>
            {slides.map((s, i) => (
              <li key={s.href}>
                <Button
                  className={styles.dot}
                  aria-label={`Avviso ${i + 1} di ${totale}`}
                  aria-current={i === attiva ? 'true' : undefined}
                  onPress={() => vai(i)}
                />
              </li>
            ))}
          </ul>
          <Button
            className={styles.arrow}
            aria-label="Avviso successivo"
            onPress={() => vai(attiva + 1)}
          >
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      ) : null}
    </section>
  )
}
