import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components'
import { trovaDocenti } from '@/lib/corsi'
import type { Scuola } from '@/payload-types'

import styles from './docenti.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Docenti',
  description: 'Elenco dei docenti dell’Accademia Albertina con corsi, ricevimento e contatti.',
  alternates: { canonical: '/docenti' },
}

/** Iniziale del cognome senza accenti, per raggruppare l'elenco. */
const iniziale = (cognome: string) =>
  cognome.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase() || '#'

export default async function DocentiPage() {
  const docenti = await trovaDocenti()
  const gruppi = new Map<string, typeof docenti>()
  for (const d of docenti) {
    const lettera = iniziale(d.cognome)
    gruppi.set(lettera, [...(gruppi.get(lettera) ?? []), d])
  }

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Docenti' }]} />
      <header className={styles.header}>
        <h1>Docenti</h1>
        <p className={styles.intro}>
          {docenti.length} docenti in servizio. Nella pagina di ognuno trovi corsi, ricevimento e
          contatti.
        </p>
      </header>

      <div className={styles.legenda}>
        <p className={styles.legendaTitolo} id="legenda-scuole">
          Legenda
        </p>
        <dl aria-labelledby="legenda-scuole">
          <div>
            <dt className={styles.principale}>Pittura</dt>
            <dd>scuola di afferenza principale</dd>
          </div>
          <div>
            <dt className={styles.pro}>+ Scultura</dt>
            <dd>pro-afferenza: il docente insegna anche in altre scuole</dd>
          </div>
        </dl>
      </div>

      {gruppi.size > 0 ? (
        <>
          <nav aria-label="Iniziale del cognome" className={styles.lettere}>
            <ul>
              {[...gruppi.keys()].map((l) => (
                <li key={l}>
                  <a href={`#lettera-${l}`}>{l}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.elenco}>
            {[...gruppi.entries()].map(([lettera, voci]) => (
              <section key={lettera} aria-labelledby={`lettera-${lettera}`}>
                <h2 id={`lettera-${lettera}`} className={styles.lettera} tabIndex={-1}>
                  {lettera}
                </h2>
                <ul className={styles.voci}>
                  {voci.map((d) => {
                    const scuole = (d.scuole ?? []).filter(
                      (s): s is Scuola => typeof s === 'object',
                    )
                    return (
                      <li key={d.id}>
                        <Link href={`/docenti/${d.slug}`} className={styles.nome}>
                          {d.cognome} {d.nome}
                        </Link>
                        {scuole.length > 0 ? (
                          <span className={styles.scuole}>
                            <span className={styles.principale}>
                              <span className="visually-hidden">Afferenza: </span>
                              {scuole[0].nome}
                            </span>
                            {scuole.length > 1 ? (
                              <span className={styles.pro}>
                                {' '}
                                <span className="visually-hidden">Pro-afferenza: </span>
                                <span aria-hidden="true">+ </span>
                                {scuole
                                  .slice(1)
                                  .map((s) => s.nome)
                                  .join(', ')}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      ) : (
        <p>L’elenco dei docenti non è ancora disponibile.</p>
      )}
    </div>
  )
}
