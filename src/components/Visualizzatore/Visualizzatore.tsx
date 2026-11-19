'use client'

import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'

import type { TipoAnteprima } from '@/utilities/pdf'

import { PulsanteIcona } from './strumenti'
import { VistaImmagine } from './VistaImmagine'
import { VistaPdf } from './VistaPdf'
import styles from './Visualizzatore.module.css'

export type VoceAnteprima = {
  url: string
  tipo: TipoAnteprima
  titolo: string
  /** Nome del file da proporre allo scaricamento. */
  file?: string
  /** Formato e peso, es. «PDF · 1,2 MB». */
  info?: string
}

/** Testo del link senza le parti per i soli lettori di schermo (es. «si apre in…»). */
function testoVisibile(a: HTMLElement) {
  const copia = a.cloneNode(true) as HTMLElement
  copia.querySelectorAll('.visually-hidden, [aria-hidden="true"]').forEach((n) => n.remove())
  return copia.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function nomeDaIndirizzo(url: string) {
  try {
    const nome = decodeURIComponent(new URL(url, location.href).pathname.split('/').pop() ?? '')
    return nome || 'Documento'
  } catch {
    return 'Documento'
  }
}

export function voceDaLink(a: HTMLAnchorElement): VoceAnteprima {
  const url = a.getAttribute('href') ?? ''
  const tipo = a.dataset.anteprima === 'immagine' ? 'immagine' : 'pdf'
  const titolo =
    a.dataset.titolo ||
    testoVisibile(a) ||
    a.querySelector('img')?.getAttribute('alt') ||
    nomeDaIndirizzo(url)
  return { url, tipo, titolo, file: a.dataset.file, info: a.dataset.info }
}

type Aperto = { voci: VoceAnteprima[]; indice: number }

/**
 * Visualizzatore di PDF e immagini del sito, a schermo intero. È montato una volta nel
 * layout e si apre col clic su qualsiasi link con `data-anteprima` (vedi attributiFile):
 * così funziona anche nei testi dei contenuti e nei componenti renderizzati sul server.
 * I link dentro un contenitore `data-anteprime` formano una raccolta: si scorre con
 * le frecce. Ctrl/Cmd+clic e clic centrale aprono il file come un link normale.
 * Il tasto Indietro (anche su Android) chiude il visualizzatore invece di lasciare la pagina.
 */
export function Visualizzatore() {
  const [aperto, setAperto] = useState<Aperto | null>(null)
  const voceInStoria = useRef(false)
  /** Link da cui è partita l'apertura: alla chiusura il fuoco torna lì. */
  const origine = useRef<HTMLElement | null>(null)

  const apri = useCallback((voci: VoceAnteprima[], indice: number) => {
    if (!voceInStoria.current) {
      window.history.pushState({ ...window.history.state, anteprima: true }, '')
      voceInStoria.current = true
    }
    setAperto({ voci, indice })
  }, [])

  const chiudi = useCallback(() => {
    setAperto(null)
    if (voceInStoria.current) {
      voceInStoria.current = false
      window.history.back()
    }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-anteprima]')
      if (!a?.getAttribute('href')) return
      e.preventDefault()
      const gruppo = a.closest('[data-anteprime]')
      const link = gruppo
        ? Array.from(gruppo.querySelectorAll<HTMLAnchorElement>('a[data-anteprima]'))
        : [a]
      const voci: VoceAnteprima[] = []
      for (const l of link) {
        const v = voceDaLink(l)
        if (v.url && !voci.some((x) => x.url === v.url)) voci.push(v)
      }
      origine.current = a
      apri(
        voci,
        Math.max(
          0,
          voci.findIndex((v) => v.url === a.getAttribute('href')),
        ),
      )
    }
    const onPopState = () => {
      if (!voceInStoria.current) return
      voceInStoria.current = false
      setAperto(null)
    }
    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPopState)
    }
  }, [apri])

  // Alla chiusura il fuoco torna al link di partenza (React Aria lo fa solo per i suoi trigger)
  useEffect(() => {
    if (aperto) return
    const el = origine.current
    origine.current = null
    if (el?.isConnected) requestAnimationFrame(() => el.focus({ preventScroll: true }))
  }, [aperto])

  return (
    <ModalOverlay
      isOpen={aperto !== null}
      onOpenChange={(v) => !v && chiudi()}
      isDismissable={false}
      className={styles.overlay}
    >
      <Modal className={styles.modale}>
        {aperto ? (
          <Finestra
            aperto={aperto}
            onCambia={(indice) => setAperto({ ...aperto, indice })}
            onChiudi={chiudi}
          />
        ) : null}
      </Modal>
    </ModalOverlay>
  )
}

function Finestra({
  aperto,
  onCambia,
  onChiudi,
}: {
  aperto: Aperto
  onCambia: (indice: number) => void
  onChiudi: () => void
}) {
  const { voci, indice } = aperto
  const voce = voci[indice]
  const raccolta = voci.length > 1
  const precedente = () => onCambia((indice - 1 + voci.length) % voci.length)
  const successivo = () => onCambia((indice + 1) % voci.length)

  // Frecce sinistra/destra tra le immagini della raccolta (nei PDF scorrono la pagina)
  const onTasto = (e: React.KeyboardEvent) => {
    if (!raccolta || voce.tipo !== 'immagine' || e.target instanceof HTMLInputElement) return
    if (e.key === 'ArrowLeft') precedente()
    else if (e.key === 'ArrowRight') successivo()
    else return
    e.preventDefault()
  }

  const titolo = (
    <div className={styles.titolo}>
      {voce.info ? <p className={styles.info}>{voce.info}</p> : null}
      <Heading slot="title" className={styles.nome} title={voce.titolo}>
        {voce.titolo}
      </Heading>
    </div>
  )

  const scarica = (
    <a className={styles.azione} href={voce.url} download={voce.file || true}>
      <Download size={20} strokeWidth={1.75} aria-hidden />
      <span className={styles.testoAzione}>Scarica</span>
      <span className="visually-hidden">{voce.titolo}</span>
    </a>
  )
  const nuovaScheda = (
    <a
      className={`${styles.azione} ${styles.soloIcona}`}
      href={voce.url}
      target="_blank"
      rel="noopener"
      title="Apri in una nuova scheda"
    >
      <ExternalLink size={20} strokeWidth={1.75} aria-hidden />
      <span className="visually-hidden">Apri {voce.titolo} in una nuova scheda</span>
    </a>
  )
  const azioni = (
    <>
      {raccolta ? (
        <div className={styles.gruppo} role="group" aria-label="Altri file">
          <PulsanteIcona etichetta="File precedente" onPress={precedente}>
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          </PulsanteIcona>
          <span className={styles.contatore} aria-live="polite">
            {indice + 1} di {voci.length}
          </span>
          <PulsanteIcona etichetta="File successivo" onPress={successivo}>
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </PulsanteIcona>
        </div>
      ) : null}
      {scarica}
      {nuovaScheda}
    </>
  )
  const chiudi = (
    <PulsanteIcona etichetta="Chiudi" onPress={onChiudi} className={styles.chiudi}>
      <X size={24} strokeWidth={1.75} aria-hidden />
    </PulsanteIcona>
  )
  const alternativa = (
    <div className={styles.alternativa}>
      <a className="btn btn-chiaro" href={voce.url} download={voce.file || true}>
        <Download aria-hidden /> Scarica il file
      </a>
      <a className="btn btn-contorno-chiaro" href={voce.url} target="_blank" rel="noopener">
        <ExternalLink aria-hidden /> Apri in una nuova scheda
      </a>
    </div>
  )

  return (
    <Dialog className={styles.dialogo}>
      {/* Solo scorciatoie da tastiera: i comandi veri sono i pulsanti della barra */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className={styles.tastiera} onKeyDown={onTasto}>
        {voce.tipo === 'pdf' ? (
          <VistaPdf
            key={voce.url}
            url={voce.url}
            nome={voce.titolo}
            titolo={titolo}
            azioni={azioni}
            chiudi={chiudi}
            alternativa={alternativa}
          />
        ) : (
          <VistaImmagine
            key={voce.url}
            url={voce.url}
            nome={voce.titolo}
            titolo={titolo}
            azioni={azioni}
            chiudi={chiudi}
            alternativa={alternativa}
          />
        )}
      </div>
    </Dialog>
  )
}
