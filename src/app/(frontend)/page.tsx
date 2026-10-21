import Link from 'next/link'

import { Alert, AvvisoCard } from '@/components'
import { categorieAvviso, sommarioAvviso, ultimiAvvisi } from '@/lib/avvisi'

import styles from './home.module.css'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const avvisi = await ultimiAvvisi(3)

  return (
    <div className={`container ${styles.page}`}>
      <h1>Accademia Albertina di Belle Arti di Torino</h1>
      <Alert tone="info" title="Sito in costruzione">
        <p>
          Il sito ufficiale resta <a href="https://albertina-academy.it">albertina-academy.it</a>{' '}
          fino al passaggio alla nuova piattaforma.
        </p>
      </Alert>

      <section aria-labelledby="ultimi-avvisi" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="ultimi-avvisi">Ultimi avvisi</h2>
          <Link href="/avvisi">Tutti gli avvisi</Link>
        </div>
        {avvisi.length > 0 ? (
          <ul className={styles.grid}>
            {avvisi.map((a) => (
              <li key={a.id}>
                <AvvisoCard
                  titolo={a.titolo}
                  href={`/avvisi/${a.slug}`}
                  data={a.pubblicatoIl}
                  sommario={sommarioAvviso(a)}
                  categorie={categorieAvviso(a)}
                  headingLevel={3}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>Non ci sono avvisi pubblicati.</p>
        )}
      </section>
    </div>
  )
}
