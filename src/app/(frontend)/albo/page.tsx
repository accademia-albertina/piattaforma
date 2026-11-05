import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, TestataPagina } from '@/components'
import { SEZIONE_ALBO, SEZIONI_ALBO } from '@/lib/albo'
import { riepilogoAlbo } from '@/lib/albo-dati'

import { AttoAlbo } from './AttoAlbo'
import styles from './albo.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Albo online',
  description:
    'Albo online dell’Accademia Albertina: bandi di concorso, bandi per studenti, bandi di gara e albo sindacale.',
  alternates: { canonical: '/albo' },
}

export default async function AlboPage() {
  const { conteggi, aperti, recenti } = await riepilogoAlbo()
  const elenco = aperti.length > 0 ? aperti : recenti

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Albo online' }]} />
      <TestataPagina
        occhiello="Accademia"
        titolo="Albo online"
        sommario="Bandi, procedure e comunicazioni ufficiali dell’Accademia, con i documenti di ogni atto: dal bando alla graduatoria."
      />

      <nav aria-label="Sezioni dell’Albo" className={styles.sezioni}>
        <ul>
          {SEZIONI_ALBO.map((s) => (
            <li key={s}>
              <Link href={`/albo/${s}`}>
                <span className={styles.sezioneTitolo}>{SEZIONE_ALBO[s].titolo}</span>
                <span className={styles.sezioneSommario}>{SEZIONE_ALBO[s].sommario}</span>
                <span className={styles.piede}>
                  <span>{conteggi[s] === 1 ? '1 atto' : `${conteggi[s]} atti`}</span>
                  <span className={styles.apri} aria-hidden="true">
                    Apri <ArrowRight size={16} strokeWidth={1.5} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {elenco.length > 0 ? (
        <section aria-labelledby="albo-elenco" className={styles.blocco}>
          <div className={styles.bloccoTesta}>
            <h2 id="albo-elenco">
              {aperti.length > 0 ? 'Bandi aperti' : 'Ultimi atti pubblicati'}
            </h2>
            <p>
              {aperti.length > 0
                ? 'Con la scadenza più vicina in alto.'
                : 'Al momento non ci sono bandi con scadenza aperta.'}
            </p>
          </div>
          <div className={styles.atti}>
            {elenco.map((a) => (
              <AttoAlbo key={a.id} atto={a} livello={3} conSezione />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
