import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components'
import { NOVITA } from '@/content/novita'

import styles from './novita.module.css'

export const metadata: Metadata = {
  title: 'Novità della piattaforma',
  description: 'Cosa è cambiato nella nuova piattaforma dell’Accademia Albertina, dal più recente.',
  alternates: { canonical: '/novita' },
  robots: { index: false },
}

const formatoData = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Rome',
})

export default function NovitaPage() {
  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Novità' }]} />
      <header className={styles.header}>
        <h1>Novità</h1>
        <p className={styles.intro}>Cosa è cambiato nella nuova piattaforma, dal più recente.</p>
      </header>

      <ol className={styles.elenco}>
        {NOVITA.map((n) => (
          <li key={`${n.data}-${n.titolo}`} className={styles.voce}>
            <time dateTime={n.data} className={`eyebrow ${styles.data}`}>
              {formatoData.format(new Date(`${n.data}T12:00:00Z`))}
            </time>
            <div>
              <h2 className={styles.titolo}>{n.titolo}</h2>
              <ul className={styles.punti}>
                {n.punti.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
