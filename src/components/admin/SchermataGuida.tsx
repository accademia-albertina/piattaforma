import schermate from '@/content/guida-schermate.json'

import styles from './Guida.module.css'

type Segno = { n: number; x: number; y: number; w: number; h: number }
type Dati = { larghezza: number; altezza: number; segni: Segno[] }

const DATI = schermate as Record<string, Dati>

/** Le schermate generate per una guida (quelle che mancano nel JSON non si mostrano). */
export function haSchermata(id: string): boolean {
  return id in DATI
}

/** Vero se nella schermata c'è un riquadro per il passo n. */
export function haSegno(id: string, n: number): boolean {
  return DATI[id]?.segni.some((s) => s.n === n) ?? false
}

/**
 * Schermata del pannello con i riquadri numerati sopra, in versione chiara e scura (si vede
 * quella del tema in uso). I riquadri sono HTML, non dipinti nell'immagine: restano nitidi e
 * hanno gli stessi numeri dei passi. Le immagini le genera scripts/guida/schermate.mjs.
 */
export default function SchermataGuida({ id, didascalia }: { id: string; didascalia: string }) {
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
        {(['chiaro', 'scuro'] as const).map((tema) => (
          <a
            key={tema}
            className={styles[tema]}
            href={`/guida/${id}-${tema}.webp`}
            target="_blank"
            rel="noreferrer"
            aria-label={`${didascalia} Apri la schermata a grandezza piena (nuova scheda)`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- immagine statica già ottimizzata */}
            <img
              src={`/guida/${id}-${tema}.webp`}
              alt={descrizione}
              width={dati.larghezza}
              height={dati.altezza}
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
        {dati.segni.map((s, i) => (
          <span
            key={i}
            className={s.y < 4 ? `${styles.segno} ${styles.segnoInAlto}` : styles.segno}
            data-n={s.n}
            aria-hidden
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }}
          >
            <span className={styles.numeroSegno}>{s.n}</span>
          </span>
        ))}
      </div>
      <figcaption className={styles.didascalia}>{didascalia}</figcaption>
    </figure>
  )
}
