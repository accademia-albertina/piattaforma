import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, TestataPagina } from '@/components'
import { TIPI_CALENDARIO, TIPO_LABELS } from '@/lib/calendari'
import { elencoCalendari } from '@/lib/calendari-dati'

import styles from './calendari.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Orari e calendari',
  description:
    'Orario delle lezioni, calendari degli esami e delle presentazioni dell’Accademia Albertina: consultabili e stampabili.',
  alternates: { canonical: '/calendari' },
}

const dataIt = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Rome',
  }).format(new Date(iso))

export default async function CalendariPage() {
  const calendari = await elencoCalendari()
  const gruppi = TIPI_CALENDARIO.map((tipo) => ({
    tipo,
    voci: calendari.filter((c) => c.tipo === tipo),
  })).filter((g) => g.voci.length > 0)

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Orari e calendari' }]} />
      <TestataPagina
        occhiello="Didattica"
        titolo="Orari e calendari"
        sommario="Orario delle lezioni, esami e presentazioni: si consultano qui, con i filtri, e si stampano."
      />

      <section aria-labelledby="esami-iscrizioni" className={styles.gruppo}>
        <h2 id="esami-iscrizioni">Esami e iscrizioni</h2>
        <ul>
          <li>
            <Link href="/esami">
              <span className={styles.anno}>Sessione in corso</span>
              <span className={styles.titolo}>Appelli d’esame</span>
              <span className={styles.sottotitolo}>
                Data, ora, aula e commissione; gli studenti si iscrivono da qui.
              </span>
              <span className={styles.piede}>
                <span>Sempre aggiornato</span>
                <span className={styles.apri} aria-hidden="true">
                  Apri <ArrowRight size={16} strokeWidth={1.5} />
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {gruppi.length === 0 ? (
        <p className={styles.vuoto}>Non ci sono ancora calendari pubblicati.</p>
      ) : (
        gruppi.map((g) => (
          <section key={g.tipo} aria-labelledby={`tipo-${g.tipo}`} className={styles.gruppo}>
            <h2 id={`tipo-${g.tipo}`}>{TIPO_LABELS[g.tipo]}</h2>
            <ul>
              {g.voci.map((c) => (
                <li key={c.id}>
                  <Link href={`/calendari/${c.slug}`}>
                    <span className={styles.anno}>A.A. {c.annoAccademico}</span>
                    <span className={styles.titolo}>{c.titolo}</span>
                    {c.sottotitolo ? (
                      <span className={styles.sottotitolo}>{c.sottotitolo}</span>
                    ) : null}
                    <span className={styles.piede}>
                      <span>Aggiornato il {dataIt(c.updatedAt)}</span>
                      <span className={styles.apri} aria-hidden="true">
                        Apri <ArrowRight size={16} strokeWidth={1.5} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
