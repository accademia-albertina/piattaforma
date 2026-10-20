'use client'

import Link from 'next/link'
import { useId, useState } from 'react'

import styles from './SiteHeader.module.css'

export type NavItem = { label: string; href: string }

export type SiteHeaderProps = {
  /** Voce di menu della pagina corrente (per aria-current). */
  currentHref?: string
  mainNav?: NavItem[]
  utilityNav?: NavItem[]
}

// Voci provvisorie: la struttura definitiva arriva con l'architettura dell'informazione.
const DEFAULT_MAIN_NAV: NavItem[] = [
  { label: 'Accademia', href: '/accademia' },
  { label: 'Didattica', href: '/didattica' },
  { label: 'Studenti', href: '/studenti' },
  { label: 'Avvisi', href: '/avvisi' },
  { label: 'Contatti', href: '/contatti' },
]

const DEFAULT_UTILITY_NAV: NavItem[] = [
  { label: 'Albo online', href: '/albo' },
  { label: 'Amministrazione trasparente', href: '/amministrazione-trasparente' },
  { label: 'Area riservata', href: '/admin' },
]

export function SiteHeader({
  currentHref,
  mainNav = DEFAULT_MAIN_NAV,
  utilityNav = DEFAULT_UTILITY_NAV,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <nav aria-label="Servizi" className={`container ${styles.topBarInner}`}>
          <ul className={styles.utilityList}>
            {utilityNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.main}>
        <div className={`container ${styles.mainInner}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Accademia Albertina</span>
            <span className={styles.brandSub}>di Belle Arti di Torino</span>
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Chiudi menu' : 'Menu'}
          </button>

          <nav aria-label="Principale" id={menuId} className={styles.nav} data-open={open || undefined}>
            <ul className={styles.navList}>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={item.href === currentHref ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
