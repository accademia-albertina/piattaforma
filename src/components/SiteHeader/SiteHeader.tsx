'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components'

import {
  MENU_IN_EVIDENZA,
  MENU_PRINCIPALE,
  MENU_SERVIZI,
  type GruppoMenu,
  type VoceMenu,
} from '@/lib/navigazione'

import styles from './SiteHeader.module.css'

export type SiteHeaderProps = {
  /** Pagina corrente (per aria-current). Se assente si ricava dall'URL. */
  currentHref?: string
  servizi?: typeof MENU_SERVIZI
  inEvidenza?: VoceMenu[]
  colonne?: GruppoMenu[][]
}

function MenuLink({
  voce,
  className,
  current,
}: {
  voce: VoceMenu
  className?: string
  current?: 'page'
}) {
  if (voce.esterno) {
    return (
      <a href={voce.href} className={className} target="_blank" rel="noopener noreferrer">
        {voce.label}
        <span aria-hidden="true">↗</span>
        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
      </a>
    )
  }
  return (
    <Link href={voce.href} className={className} aria-current={current}>
      {voce.label}
    </Link>
  )
}

const Icona = {
  utente: (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  ),
  cerca: (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  ),
}

export function SiteHeader({
  currentHref,
  servizi = MENU_SERVIZI,
  inEvidenza = MENU_IN_EVIDENZA,
  colonne = MENU_PRINCIPALE,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const path = currentHref ?? pathname

  // Il menu si chiude quando si cambia pagina (stato aggiornato durante il render, senza effetto).
  const [ultimoPath, setUltimoPath] = useState(pathname)
  if (ultimoPath !== pathname) {
    setUltimoPath(pathname)
    setOpen(false)
  }

  // Esc chiude il menu e riporta il focus sul pulsante.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const current = (href: string) => (path === href ? 'page' : undefined)

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <nav aria-label="Servizi" className={`container ${styles.topBarInner}`}>
          <ul className={styles.utilityList}>
            {servizi.sinistra.map((v) => (
              <li key={v.href}>
                <MenuLink voce={v} />
              </li>
            ))}
          </ul>
          <ul className={styles.utilityList}>
            {servizi.destra.map((v) => (
              <li key={v.href}>
                <MenuLink voce={v} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Disclosure isExpanded={open} onExpandedChange={setOpen} className={styles.main}>
        <div className={`container ${styles.mainInner}`}>
          <Link href="/" className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statico, non serve l'ottimizzazione di next/image */}
            <img
              src="/brand/logo-albertina-bianco.svg"
              alt="Accademia Albertina di Belle Arti di Torino, home"
              width={166}
              height={76}
            />
          </Link>

          <div className={styles.actions}>
            <Link href="/admin" className={styles.iconButton} aria-label="Area riservata">
              {Icona.utente}
            </Link>
            <Link
              href="/cerca"
              className={styles.iconButton}
              aria-label="Cerca nel sito"
              aria-current={current('/cerca')}
            >
              {Icona.cerca}
            </Link>
            <Button slot="trigger" ref={triggerRef} className={styles.menuToggle} aria-label="Menu">
              <span className={styles.burger} aria-hidden="true" data-open={open || undefined}>
                <span />
                <span />
                <span />
              </span>
            </Button>
          </div>
        </div>

        <DisclosurePanel className={styles.panel}>
          <nav aria-label="Principale" className={`container ${styles.megaMenu}`}>
            <div className={styles.column}>
              <h2 className={styles.highlightTitle}>In evidenza</h2>
              <ul className={styles.highlightList}>
                {inEvidenza.map((v) => (
                  <li key={v.href}>
                    <MenuLink voce={v} current={current(v.href)} />
                  </li>
                ))}
              </ul>
            </div>
            {colonne.map((gruppi) => (
              <div key={gruppi[0].titolo} className={styles.column}>
                {gruppi.map((g) => (
                  <div key={g.titolo} className={styles.group}>
                    <h2 className={styles.groupTitle}>{g.titolo}</h2>
                    <ul className={styles.groupList}>
                      {g.voci.map((v) => (
                        <li key={v.href}>
                          <MenuLink voce={v} current={current(v.href)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </DisclosurePanel>
      </Disclosure>
    </header>
  )
}
