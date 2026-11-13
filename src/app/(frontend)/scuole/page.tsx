import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, SchedaScuola, TestataPagina } from '@/components'
import { trovaScuole } from '@/lib/avvisi'
import { immagineScuola } from '@/lib/immagineScuola'
import { LIVELLI, perDipartimento } from '@/lib/scuole'

import styles from './scuole.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offerta formativa',
  description:
    'Le scuole dell’Accademia Albertina: Lauree e Lauree magistrali con lo stesso valore di quelle universitarie.',
  alternates: { canonical: '/scuole' },
}

/** Come si arriva al diploma: dal dipartimento ai corsi del piano di studi. */
const PERCORSO = [
  {
    termine: 'Dipartimento',
    testo: 'Riunisce scuole affini, come le Arti visive o le Arti della progettazione.',
  },
  {
    termine: 'Scuola',
    testo: 'È il tuo indirizzo di studio, per esempio Pittura o Scultura: equivale al corso di laurea.',
  },
  {
    termine: 'Triennio e biennio',
    testo: `Il triennio dura ${LIVELLI.triennio.anni} anni (${LIVELLI.triennio.cfa} CFA). Il biennio specialistico ne dura ${LIVELLI.biennio.anni} (${LIVELLI.biennio.cfa} CFA).`,
  },
  {
    termine: 'Corsi e tesi',
    testo: 'Segui i corsi del piano di studi, anche di altre scuole, e discuti la tesi per diplomarti.',
  },
]

export default async function ScuolePage() {
  const dipartimenti = perDipartimento(await trovaScuole())

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Offerta formativa' }]} />

      <TestataPagina
        occhiello="Didattica"
        titolo="Offerta formativa"
        sommario="Lauree e Lauree magistrali con lo stesso valore di quelle universitarie: dieci scuole in quattro dipartimenti."
      >
        <div className={styles.azioni}>
          <Link href="/didattica/ammissioni" className="btn btn-primario">
            Ammissioni
          </Link>
          <Link href="/corsi" className="btn btn-secondario">
            Tutti i corsi
          </Link>
        </div>
      </TestataPagina>

      <section aria-labelledby="come-funziona" className={styles.sezione}>
        <h2 id="come-funziona" className={styles.titoloSezione}>
          Come si arriva al diploma
        </h2>
        <ol className={styles.percorso}>
          {PERCORSO.map((p) => (
            <li key={p.termine}>
              <p className={styles.termine}>{p.termine}</p>
              <p className={styles.spiegazione}>{p.testo}</p>
            </li>
          ))}
        </ol>
      </section>

      {dipartimenti.map((d) => (
        <section key={d.value} aria-labelledby={`dip-${d.value}`} className={styles.sezione}>
          <h2 id={`dip-${d.value}`} className={styles.titoloSezione}>
            {d.label}
          </h2>
          <ul className={styles.griglia}>
            {d.scuole.map((s) => (
              <li key={s.id}>
                <SchedaScuola
                  nome={s.nome}
                  slug={s.slug ?? ''}
                  href={`/scuole/${s.slug}`}
                  immagine={immagineScuola(s)}
                  invito={
                    s.biennio?.attivo === false ? 'Triennio' : 'Triennio e biennio'
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
