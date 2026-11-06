'use client'

import { LogOut, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Menu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components'

import styles from './MenuUtente.module.css'

export type UtenteCollegato = {
  nome?: string | null
  cognome?: string | null
  email: string
  roles?: string[] | null
}

export type MenuUtenteProps = {
  /** Classi del pulsante e dell'etichetta, per allinearlo alle altre icone dell'header. */
  classePulsante?: string
  classeEtichetta?: string
  /**
   * Utente già noto (storie e test). Se assente lo chiede al server: così le pagine pubbliche
   * restano in cache e l'header si aggiorna dopo il caricamento.
   */
  utente?: UtenteCollegato | null
}

const PANNELLO = [
  'admin',
  'vicedirezione',
  'redazione',
  'segreteria',
  'amministrativo',
  'erasmus',
  'biblioteca',
  'docente',
]

export function iniziali(u: UtenteCollegato) {
  const da = [u.nome, u.cognome].filter(Boolean) as string[]
  if (da.length)
    return da
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  return u.email.slice(0, 2).toUpperCase()
}

/**
 * Icona dell'utente nell'header del sito. Senza accesso: “Accedi”. Con l'accesso: iniziali e
 * “La mia area”, con un menu per le iscrizioni (studenti), il pannello (personale) e l'uscita.
 */
export function MenuUtente({ classePulsante, classeEtichetta, utente: noto }: MenuUtenteProps) {
  const [utente, setUtente] = useState<UtenteCollegato | null>(noto ?? null)

  useEffect(() => {
    if (noto !== undefined) return
    let annullato = false
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: UtenteCollegato | null } | null) => {
        if (!annullato) setUtente(d?.user ?? null)
      })
      .catch(() => {})
    return () => {
      annullato = true
    }
  }, [noto])

  if (!utente) {
    return (
      <Link href="/area-riservata" className={classePulsante}>
        <UserRound size={24} strokeWidth={1.5} aria-hidden />
        <span className={classeEtichetta}>Accedi</span>
      </Link>
    )
  }

  const ruoli = utente.roles ?? []
  const studente = ruoli.includes('studente')
  const personale = ruoli.some((r) => PANNELLO.includes(r))
  const nome = [utente.nome, utente.cognome].filter(Boolean).join(' ') || utente.email

  async function esci() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    // URL assoluto: ricarica tutto, così ogni parte della pagina dimentica l'utente
    window.location.replace(new URL('/', window.location.origin).href)
  }

  return (
    <MenuTrigger>
      <Button className={classePulsante} aria-label={`La mia area, ${nome}`}>
        <span className={styles.iniziali} aria-hidden>
          {iniziali(utente)}
        </span>
        <span className={classeEtichetta} aria-hidden>
          La mia area
        </span>
      </Button>
      <Popover placement="bottom end" offset={4} className={styles.popover}>
        <div className={styles.chi}>
          <p className={styles.nome}>{nome}</p>
          <p className={styles.email}>{utente.email}</p>
        </div>
        <Menu className={styles.menu} aria-label="La mia area">
          {studente ? (
            <>
              <MenuItem className={styles.voce} href="/la-mia-area">
                Le mie iscrizioni
              </MenuItem>
              <MenuItem className={styles.voce} href="/la-mia-area#guida">
                Guida per gli studenti
              </MenuItem>
            </>
          ) : null}
          {personale ? (
            <MenuItem className={styles.voce} href="/admin">
              Pannello
            </MenuItem>
          ) : null}
          {!studente && !personale ? (
            <MenuItem className={styles.voce} href="/accesso-in-attesa">
              Stato dell’account
            </MenuItem>
          ) : null}
          <Separator className={styles.separatore} />
          <MenuItem className={styles.voce} onAction={esci} textValue="Esci">
            <LogOut size={18} strokeWidth={1.5} aria-hidden /> Esci
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
