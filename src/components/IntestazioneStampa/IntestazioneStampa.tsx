import { CONTATTI } from '@/lib/navigazione'

import styles from './IntestazioneStampa.module.css'

/**
 * Intestazione istituzionale visibile solo in stampa (orari, calendari, pagine):
 * logo, nome dell’ente e indirizzo. A schermo resta nascosta.
 */
export function IntestazioneStampa({ visibileASchermo = false }: { visibileASchermo?: boolean }) {
  return (
    <div className={styles.intestazione} data-schermo={visibileASchermo || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG statico, serve anche in stampa */}
      <img src="/brand/stemma-albertina.svg" alt="" width={56} height={56} />
      <div>
        <p className={styles.nome}>Accademia Albertina di Belle Arti di Torino</p>
        <p className={styles.indirizzo}>
          {CONTATTI.indirizzo.join(', ')} · Tel. {CONTATTI.telefono.label} · {CONTATTI.peo}
        </p>
      </div>
    </div>
  )
}
