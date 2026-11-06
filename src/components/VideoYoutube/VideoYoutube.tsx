'use client'

import { Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import styles from './VideoYoutube.module.css'

/**
 * Video YouTube che si carica solo al clic (youtube-nocookie): niente cookie né richieste
 * a Google finché la persona non sceglie di guardarlo. Il riquadro mostra un'immagine nostra.
 */
export function VideoYoutube({
  id,
  titolo,
  copertina,
}: {
  id: string
  titolo: string
  copertina?: ReactNode
}) {
  const [attivo, setAttivo] = useState(false)
  if (attivo) {
    return (
      <div className={styles.video}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titolo}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <div className={styles.video}>
      {copertina}
      <button type="button" className={styles.play} onClick={() => setAttivo(true)}>
        <span className={styles.icona} aria-hidden>
          <Play size={28} strokeWidth={1.5} fill="currentColor" />
        </span>
        <span className={styles.testo}>
          Guarda il video <span className="visually-hidden">{titolo}</span>
        </span>
      </button>
      <p className={styles.nota}>Il video si apre da YouTube.</p>
    </div>
  )
}
