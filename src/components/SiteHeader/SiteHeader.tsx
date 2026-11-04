'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, UserRound } from 'lucide-react'
import { Button, Disclosure, DisclosurePanel, Heading } from 'react-aria-components'

import {
  MENU_IN_EVIDENZA,
  MENU_PRINCIPALE,
  MENU_SERVIZI,
  type GruppoMenu,
  type VoceMenu,
} from '@/lib/navigazione'

import { MenuLink } from '../MenuLink/MenuLink'

import { useCompatto, useMediaQuery } from './hooks'

import styles from './SiteHeader.module.css'

export type SiteHeaderProps = {
  /** Pagina corrente (per aria-current). Se assente si ricava dall'URL. */
  currentHref?: string
  servizi?: typeof MENU_SERVIZI
  inEvidenza?: VoceMenu[]
  colonne?: GruppoMenu[][]
}

const ICONA = { size: 24, strokeWidth: 1.5, 'aria-hidden': true } as const

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

  // Con il menu aperto la pagina sotto non scorre: scorre solo il pannello.
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prima = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prima
    }
  }, [open])

  // La barra rossa resta in alto mentre si scorre: lo spazio che occupa non deve coprire
  // l'elemento che riceve il focus (scroll-padding).
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const header = headerRef.current
    if (!header || typeof ResizeObserver === 'undefined') return
    const html = document.documentElement
    const osserva = new ResizeObserver(() => {
      html.style.scrollPaddingTop = `${header.offsetHeight}px`
    })
    osserva.observe(header)
    return () => {
      osserva.disconnect()
      html.style.scrollPaddingTop = ''
    }
  }, [])

  const compatto = useCompatto()
  const desktop = useMediaQuery('(min-width: 64rem)', true)

  const current = (href: string) => (path === href ? 'page' : undefined)

  const voci = (g: GruppoMenu) => (
    <ul className={styles.groupList}>
      {g.voci.map((v) => (
        <li key={v.href}>
          <MenuLink voce={v} current={current(v.href)} />
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* La barra dei servizi scorre via con la pagina; resta fissa solo la barra rossa. */}
      <div className={styles.topBar}>
        <nav aria-label="Servizi" className={`container ${styles.topBarInner}`}>
          <ul className={`${styles.utilityList} ${styles.utilitySinistra}`}>
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

      <header
        ref={headerRef}
        className={styles.header}
        data-compatto={compatto || undefined}
      >
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
              <Link href="/admin" className={styles.iconButton}>
                <UserRound {...ICONA} />
                <span className={styles.iconLabel}>Area riservata</span>
              </Link>
              <Link href="/cerca" className={styles.iconButton} aria-current={current('/cerca')}>
                <Search {...ICONA} />
                <span className={styles.iconLabel}>Cerca</span>
              </Link>
              <Button slot="trigger" ref={triggerRef} className={styles.menuToggle}>
                <span className={styles.burger} aria-hidden="true" data-open={open || undefined}>
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.iconLabel}>Menu</span>
              </Button>
            </div>
          </div>

          {open && (
            // Il velo chiude il menu al clic; da tastiera si chiude con Esc o con il pulsante.
            <div className={styles.velo} aria-hidden="true" onClick={() => setOpen(false)} />
          )}

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
                  {gruppi.map((g) =>
                    desktop ? (
                      <div key={g.titolo} className={styles.group}>
                        <h2 className={styles.groupTitle}>{g.titolo}</h2>
                        {voci(g)}
                      </div>
                    ) : (
                      // Su mobile i gruppi sono a fisarmonica: la lista intera sarebbe lunghissima.
                      <Disclosure
                        key={g.titolo}
                        className={styles.group}
                        defaultExpanded={g.voci.some((v) => v.href === path)}
                      >
                        <Heading level={2} className={styles.groupTitle}>
                          <Button slot="trigger" className={styles.groupToggle}>
                            {g.titolo}
                            <ChevronDown size={20} strokeWidth={1.5} aria-hidden />
                          </Button>
                        </Heading>
                        <DisclosurePanel>{voci(g)}</DisclosurePanel>
                      </Disclosure>
                    ),
                  )}
                </div>
              ))}
            </nav>
          </DisclosurePanel>
        </Disclosure>
      </header>
    </>
  )
}
