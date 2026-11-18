import { SchedePercorso } from '@/components/SchedePercorso/SchedePercorso'

import { NOMI_ZONE, PIANI, type Locale, type Piano, type Zona } from './dati'
import styles from './Planimetria.module.css'

type Riquadro = { x: number; y: number; w: number; h: number }

// Pianta (unità del viewBox): ala A in verticale a sinistra, manica P-C-S in basso
const ALA_A: Riquadro = { x: 40, y: 20, w: 110, h: 300 }
const MANICA: Record<'P' | 'C' | 'S', Riquadro> = {
  P: { x: 150, y: 330, w: 170, h: 110 },
  C: { x: 320, y: 330, w: 250, h: 110 },
  S: { x: 570, y: 330, w: 210, h: 110 },
}
const INCISIONE: Riquadro = { x: 600, y: 40, w: 180, h: 200 }

/** Divide un riquadro tra i locali, in proporzione al peso. */
function dividi(r: Riquadro, locali: Locale[], verticale: boolean) {
  const tot = locali.reduce((s, l) => s + (l.peso ?? 1), 0)
  let pos = 0
  return locali.map((l) => {
    const quota = (l.peso ?? 1) / tot
    const out = verticale
      ? { x: r.x, y: r.y + pos * r.h, w: r.w, h: quota * r.h }
      : { x: r.x + pos * r.w, y: r.y, w: quota * r.w, h: r.h }
    pos += quota
    return { l, r: out }
  })
}

function Locali({
  zona,
  r,
  locali,
  verticale,
}: {
  zona: Zona
  r: Riquadro
  locali: Locale[]
  verticale: boolean
}) {
  if (!locali.length) return <rect {...r} className={styles.vuoto} />
  return (
    <>
      {dividi(r, locali, verticale).map(({ l, r: q }, i) => (
        <g key={i} className={styles[l.tipo ?? 'aula']} data-zona={zona}>
          <rect x={q.x} y={q.y} width={q.w} height={q.h} />
          {/* Etichetta in verticale se in orizzontale non ci sta */}
          <text
            x={q.x + q.w / 2}
            y={q.y + q.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            transform={
              l.sigla.length * 7.5 > q.w - 8
                ? `rotate(-90 ${q.x + q.w / 2} ${q.y + q.h / 2})`
                : undefined
            }
          >
            {l.sigla}
          </text>
        </g>
      ))}
    </>
  )
}

function Pianta({ piano }: { piano: Piano }) {
  const z = piano.zone
  return (
    <svg
      viewBox="0 0 800 490"
      className={styles.pianta}
      role="img"
      aria-labelledby={`pianta-${piano.id}`}
    >
      <title id={`pianta-${piano.id}`}>{`Pianta schematica: ${piano.nome.toLowerCase()}`}</title>
      {/* Corridoi */}
      <rect x={150} y={20} width={24} height={310} className={styles.corridoio} />
      <rect x={150} y={306} width={630} height={24} className={styles.corridoio} />
      {/* Cortile e Rotonda */}
      <ellipse
        cx={380}
        cy={170}
        rx={110}
        ry={62}
        className={piano.id === 'terra' ? styles.rotonda : styles.cortile}
      />
      <text x={380} y={170} textAnchor="middle" dominantBaseline="central" className={styles.nota}>
        {piano.id === 'terra' ? 'Rotonda' : 'Cortile'}
      </text>
      <Locali zona="A" r={ALA_A} locali={z.A ?? []} verticale />
      {(['P', 'C', 'S'] as const).map((k) => (
        <Locali key={k} zona={k} r={MANICA[k]} locali={z[k] ?? []} verticale={false} />
      ))}
      {z.G ? (
        <>
          <Locali zona="G" r={{ ...INCISIONE, h: 70 }} locali={z.G.slice(0, 1)} verticale={false} />
          <Locali
            zona="G"
            r={{ ...INCISIONE, y: INCISIONE.y + 70, h: 130 }}
            locali={z.G.slice(1)}
            verticale
          />
          <text
            x={INCISIONE.x + INCISIONE.w / 2}
            y={INCISIONE.y - 10}
            textAnchor="middle"
            className={styles.nota}
          >
            Incisione
          </text>
        </>
      ) : null}
      {/* Scale */}
      {(
        [
          ['A', 162, 60],
          ['P', 200, 318],
          ['C', 450, 318],
          ['S', 640, 318],
        ] as const
      ).map(([s, x, y]) => (
        <g key={s} className={styles.scala}>
          <rect x={x - 11} y={y - 11} width={22} height={22} />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
            {s}
          </text>
        </g>
      ))}
      <text x={460} y={472} textAnchor="middle" className={styles.via}>
        Via Accademia Albertina
      </text>
      <text
        x={24}
        y={170}
        textAnchor="middle"
        className={styles.via}
        transform="rotate(-90 24 170)"
      >
        Via Principe Amedeo
      </text>
    </svg>
  )
}

function Elenco({ piano }: { piano: Piano }) {
  return (
    <dl className={styles.elenco}>
      {(Object.keys(piano.zone) as Zona[])
        .filter((k) => piano.zone[k]?.length)
        .map((k) => (
          <div key={k}>
            <dt>
              <span className={styles.campione} data-zona={k} aria-hidden />
              {NOMI_ZONE[k]}
            </dt>
            <dd>
              {piano.zone[k]!.map((l) => l.nome ?? (l.tipo ? l.sigla : `Aula ${l.sigla}`)).join(
                ', ',
              )}
            </dd>
          </div>
        ))}
    </dl>
  )
}

/** “Piano terra” → “Terra”, “Primo piano” → “Primo”. */
const breve = (nome: string) => {
  const t = nome.replace(/\s*piano\s*/i, '')
  return t[0].toUpperCase() + t.slice(1)
}

/**
 * Planimetria della sede: una scheda per piano, con la pianta schematica (colori per scala,
 * uffici in grigio) e l'elenco di aule e uffici, che è il contenuto accessibile.
 */
export function Planimetria({ titolo = 'Planimetria della sede' }: { titolo?: string | null }) {
  return (
    <section className={styles.planimetria} aria-labelledby="planimetria-titolo">
      <h2 id="planimetria-titolo">{titolo}</h2>
      <p className={styles.intro}>
        Aule e uffici di via Accademia Albertina 6, piano per piano. Schema semplificato, non in
        scala: il colore indica la scala più vicina.
      </p>
      <SchedePercorso
        label="Piani"
        percorsi={PIANI.map((p) => ({
          id: p.id,
          label: breve(p.nome),
          contenuto: (
            <div className={styles.piano}>
              <div className={styles.contenitore}>
                <Pianta piano={p} />
              </div>
              <Elenco piano={p} />
            </div>
          ),
        }))}
      />
    </section>
  )
}
