import { Testo } from '@/components/Testo/Testo'
import { emailSpezzabile } from '@/utilities/email'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { headers } from 'next/headers'

import { annoAccademicoCorrente } from '@/access/corsi'
import { datiStudente } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { urlAccesso } from '@/auth/google'
import { Alert, Breadcrumbs, IscrizioneCorso, Tag } from '@/components'
import { dataIscrizioni, iscrizioniDelCorso } from '@/lib/iscrizioni'
import { payloadClient } from '@/lib/payload'
import { docentiDi, etichettaLivelli, orariPerPeriodo, trovaCorso } from '@/lib/corsi'
import type { Scuola } from '@/payload-types'
import { lexicalToText } from '@/utilities/lexicalText'

import styles from './corso.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const corso = await trovaCorso((await params).slug)
  if (!corso) return { title: 'Corso non trovato' }
  const docenti = docentiDi(corso).map((d) => d.nomeCompleto)
  const description =
    lexicalToText(corso.descrizione, 200) ||
    `${corso.titolo}, ${etichettaLivelli(corso.livelli)}, A.A. ${corso.annoAccademico}${docenti.length ? `, ${docenti.join(', ')}` : ''}.`
  return {
    title: `${corso.titolo} (${etichettaLivelli(corso.livelli)}, ${corso.annoAccademico})`,
    description,
    alternates: { canonical: `/corsi/${corso.slug}` },
  }
}

export default async function CorsoPage({ params }: Props) {
  const corso = await trovaCorso((await params).slug)
  if (!corso) notFound()

  const docenti = docentiDi(corso)
  const scuole = (corso.scuole ?? []).filter((s): s is Scuola => typeof s === 'object')
  const orari = orariPerPeriodo(corso.orari)
  const archivio = corso.annoAccademico !== annoAccademicoCorrente()
  const siNo = (v: boolean | null | undefined) => (v ? 'Sì' : 'No')

  // Iscrizioni: solo per i corsi dell'anno in corso
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const iscrizioni = archivio ? null : await iscrizioniDelCorso(payload, corso)
  const studente = hasRole(user, 'studente') ? datiStudente(user?.email) : null
  const iscrizione = studente
    ? (
        await payload.find({
          collection: 'iscrizioni-corsi',
          where: { studente: { equals: user!.id }, corso: { equals: corso.id } },
          limit: 1,
          depth: 0,
        })
      ).docs[0]
    : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: corso.titolo,
    description: lexicalToText(corso.descrizione, 300) || undefined,
    provider: {
      '@type': 'CollegeOrUniversity',
      name: 'Accademia Albertina di Belle Arti di Torino',
    },
    ...(corso.crediti
      ? { numberOfCredits: { '@type': 'StructuredValue', value: corso.crediti } }
      : {}),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      instructor: docenti.map((d) => ({ '@type': 'Person', name: d.nomeCompleto })),
    },
  }

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Corsi', href: '/corsi' },
          { label: corso.titolo },
        ]}
      />
      <header className={styles.header}>
        <h1>{corso.titolo}</h1>
        <ul className={styles.tags} aria-label="Livello e anno">
          {(corso.livelli ?? []).map((l) => (
            <li key={l}>
              <Tag tone="brand">{etichettaLivelli([l])}</Tag>
            </li>
          ))}
          <li>
            <Tag>A.A. {corso.annoAccademico}</Tag>
          </li>
        </ul>
        {docenti.length > 0 ? (
          <p className={styles.docenti}>
            {docenti.length > 1 ? 'Docenti: ' : 'Docente: '}
            {docenti.map((d, i) => (
              <span key={d.id}>
                {i > 0 ? ', ' : ''}
                <Link href={`/docenti/${d.slug}`}>{d.nomeCompleto}</Link>
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {archivio ? (
        <div className={styles.avviso}>
          <Alert title="Programma di un anno precedente">
            <p>
              Questo è il programma dell’anno accademico {corso.annoAccademico}.{' '}
              <Link href="/corsi">Vedi i corsi dell’anno in corso</Link>.
            </p>
          </Alert>
        </div>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
          {corso.descrizione ? (
            <section aria-labelledby="obiettivi">
              <h2 id="obiettivi">Obiettivi e contenuti</h2>
              <Testo data={corso.descrizione} className={styles.body} />
            </section>
          ) : (
            <p className={styles.vuoto}>Il programma di questo corso non è ancora pubblicato.</p>
          )}
          {corso.bibliografia ? (
            <section aria-labelledby="bibliografia">
              <h2 id="bibliografia">Bibliografia</h2>
              <Testo data={corso.bibliografia} className={styles.body} />
            </section>
          ) : null}
          {corso.altreInformazioni ? (
            <section aria-labelledby="altre-informazioni">
              <h2 id="altre-informazioni">Altre informazioni</h2>
              <Testo data={corso.altreInformazioni} className={styles.body} />
            </section>
          ) : null}
        </div>

        <div className={styles.colonna}>
          {iscrizioni ? (
            <IscrizioneCorso
              corsoId={corso.id}
              stato={iscrizioni.stato}
              apertura={iscrizioni.apertura ? dataIscrizioni(iscrizioni.apertura) : undefined}
              chiusura={iscrizioni.chiusura ? dataIscrizioni(iscrizioni.chiusura) : undefined}
              utente={!user ? 'anonimo' : studente ? 'studente' : 'altro'}
              livelloAmmesso={!studente || (corso.livelli ?? []).includes(studente.livello)}
              iscrizioneId={iscrizione?.id ?? null}
              accessoHref={urlAccesso(`/corsi/${corso.slug}`)}
            />
          ) : null}
          <aside className={styles.scheda} aria-labelledby="scheda-titolo">
            <h2 id="scheda-titolo" className={styles.schedaTitolo}>
              Scheda del corso
            </h2>
            <dl className={styles.dati}>
              {corso.crediti ? (
                <div>
                  <dt>Crediti</dt>
                  <dd>{corso.crediti} CFA</dd>
                </div>
              ) : null}
              {corso.settore ? (
                <div>
                  <dt>Settore artistico-disciplinare</dt>
                  <dd>{corso.settore}</dd>
                </div>
              ) : null}
              {corso.areaDisciplinare ? (
                <div>
                  <dt>Area disciplinare</dt>
                  <dd>{corso.areaDisciplinare}</dd>
                </div>
              ) : null}
              {scuole.length > 0 ? (
                <div>
                  <dt>Piano di studio</dt>
                  <dd>{scuole.map((s) => s.nome).join(', ')}</dd>
                </div>
              ) : null}
              <div>
                <dt>Esoneri</dt>
                <dd>{siNo(corso.esoneri)}</dd>
              </div>
              <div>
                <dt>Revisioni</dt>
                <dd>{siNo(corso.revisioni)}</dd>
              </div>
            </dl>

            {orari.length > 0 ? (
              <>
                <h3 className={styles.sottotitolo}>Orari delle lezioni</h3>
                {orari.map((g) => (
                  <div key={g.periodo} className={styles.periodo}>
                    <p className={styles.periodoNome}>{g.periodo}</p>
                    <ul className={styles.orari}>
                      {g.righe.map((r) => (
                        <li key={r.id}>
                          {r.giorno}, {r.dalle}–{r.alle}
                          {r.aula ? ` · ${r.aula}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : null}

            {docenti.length > 0 ? (
              <>
                <h3 className={styles.sottotitolo}>Ricevimento</h3>
                <ul className={styles.ricevimento}>
                  {docenti.map((d) => (
                    <li key={d.id}>
                      {docenti.length > 1 ? <strong>{d.nomeCompleto}: </strong> : null}
                      {d.ricevimento || 'Su appuntamento, scrivendo al docente.'}
                      {d.email ? (
                        <>
                          {' '}
                          <a href={`mailto:${d.email}`}>{emailSpezzabile(d.email)}</a>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </article>
  )
}
