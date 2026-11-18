import schermate from '@/content/guida-schermate.json'

import styles from './SchermataSito.module.css'

type Segno = { n: number; x: number; y: number; w: number; h: number }
type Dati = { larghezza: number; altezza: number; segni: Segno[] }

const DATI = schermate as Record<string, Dati>

/** Vero se per questa voce esiste la schermata (le genera scripts/guida/schermate.mjs). */
export const haSchermataSito = (id: string) => id in DATI

/**
 * Schermata del sito con i riquadri numerati sopra, per le guide degli studenti.
 * I riquadri sono HTML, non dipinti nell'immagine: restano nitidi e hanno gli stessi numeri
 * dei passi. Immagini in public/guida/<id>-chiaro.webp.
 */
export function SchermataSito({ id, didascalia }: { id: string; didascalia: string }) {
  const dati = DATI[id]
  if (!dati) return null
  const segni = [...new Set(dati.segni.map((s) => s.n))]
  const descrizione = segni.length
    ? `${didascalia} Riquadri numerati: ${segni.map((n) => `passo ${n}`).join(', ')}.`
    : didascalia

  return (
    <figure className={styles.schermata}>
      <div
        className={styles.cornice}
        style={{ aspectRatio: `${dati.larghezza} / ${dati.altezza}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- immagine statica già ottimizzata */}
        <img
          src={`/guida/${id}-chiaro.webp`}
          alt={descrizione}
          width={dati.larghezza}
          height={dati.altezza}
          loading="lazy"
          decoding="async"
        />
        {dati.segni.map((s, i) => (
          <span
            key={i}
            className={s.y < 6 ? `${styles.segno} ${styles.inAlto}` : styles.segno}
            aria-hidden
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }}
          >
            <span className={styles.numero}>{s.n}</span>
          </span>
        ))}
      </div>
      <figcaption className={styles.didascalia}>{didascalia}</figcaption>
    </figure>
  )
}
