import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LIVELLO_LABELS } from '@/access/corsi'
import { datiStudente } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { urlAccesso } from '@/auth/google'
import {
  Breadcrumbs,
  Fisarmonica,
  IscrizioneCorso,
  SchedaAppello,
  TestataPagina,
} from '@/components'
import { appelliConStato, giornoAppello } from '@/lib/appelli'
import type { Corso } from '@/payload-types'
import { GUIDA_STUDENTI, LINK_ISIDATA } from '@/content/guida-studenti'
import { docentiDi, etichettaLivelli } from '@/lib/corsi'
import { dataIscrizioni, iscrizioniDelCorso } from '@/lib/iscrizioni'
import { payloadClient } from '@/lib/payload'

import styles from './iscrizioni.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'La mia area',
  robots: { index: false },
}

/**
 * Area dello studente sul sito (gli studenti non entrano nel pannello): corsi a cui è iscritto,
 * con la possibilità di annullare finché la finestra è aperta, e una guida breve.
 */
export default async function LaMiaArea() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(urlAccesso('/la-mia-area'))

  const studente = hasRole(user, 'studente') ? datiStudente(user.email) : null
  const nome = [user.nome, user.cognome].filter(Boolean).join(' ')

  const { docs } = studente
    ? await payload.find({
        collection: 'iscrizioni-corsi',
        where: { studente: { equals: user.id } },
        depth: 2,
        pagination: false,
        sort: '-createdAt',
      })
    : { docs: [] }

  const righe = await Promise.all(
    docs
      .flatMap((i) => {
        const corso = typeof i.corso === 'object' ? i.corso : null
        return corso ? [{ id: i.id, createdAt: i.createdAt, corso }] : []
      })
      .map(async (i) => ({ iscrizione: i, finestra: await iscrizioniDelCorso(payload, i.corso) })),
  )

  // Esami: appelli futuri a cui lo studente è iscritto
  const { docs: iscrizioniEsami } = studente
    ? await payload.find({
        collection: 'iscrizioni-esami',
        where: { studente: { equals: user.id } },
        depth: 0,
        pagination: false,
      })
    : { docs: [] }
  const esami = iscrizioniEsami.length
    ? await appelliConStato(
        payload,
        {
          id: {
            in: iscrizioniEsami.map((i) =>
              typeof i.appello === 'object' ? i.appello.id : i.appello,
            ),
          },
        },
        user,
      )
    : []

  return (
    <div className={`container ${styles.pagina}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'La mia area' }]} />
      <TestataPagina
        occhiello="Area riservata"
        titolo="La mia area"
        sommario={
          studente
            ? `${nome || user.email}, matricola ${studente.matricola}, ${LIVELLO_LABELS[studente.livello].toLowerCase()}.`
            : 'Questa pagina è per gli studenti: si accede con l’account 12345t@ o 12345b@.'
        }
      />

      {studente ? (
        <section id="corsi" aria-labelledby="corsi-iscritti" className={styles.sezione}>
          <h2 id="corsi-iscritti">I tuoi corsi</h2>
          {righe.length === 0 ? (
            <div className={styles.vuoto}>
              <p>Non risultano iscrizioni ai corsi.</p>
              <p>
                Per iscriverti apri il corso da <Link href="/corsi">Corsi</Link> e premi “Iscriviti
                al corso” mentre le iscrizioni sono aperte.
              </p>
            </div>
          ) : (
            <ul className={styles.elenco}>
              {righe.map(({ iscrizione, finestra }) => {
                const corso = iscrizione.corso
                const docenti = docentiDi(corso)
                return (
                  <li key={iscrizione.id} className={styles.riga}>
                    <div className={styles.corso}>
                      <h3 className={styles.titoloCorso}>
                        <Link href={`/corsi/${corso.slug}`}>{corso.titolo}</Link>
                      </h3>
                      <p className={styles.dettagli}>
                        {etichettaLivelli(corso.livelli)}, A.A. {corso.annoAccademico}
                        {docenti.length
                          ? ` · ${docenti.map((d) => d.nomeCompleto).join(', ')}`
                          : ''}
                      </p>
                      <p className={styles.dettagli}>
                        Iscrizione del {dataIscrizioni(iscrizione.createdAt)}
                      </p>
                    </div>
                    <IscrizioneCorso
                      compatto
                      idRiferimento={corso.id}
                      stato={finestra.stato}
                      chiusura={finestra.chiusura ? dataIscrizioni(finestra.chiusura) : undefined}
                      utente="studente"
                      iscrizioneId={iscrizione.id}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {studente ? (
        <section id="esami" aria-labelledby="esami-titolo" className={styles.sezione}>
          <h2 id="esami-titolo">I tuoi esami</h2>
          {esami.length === 0 ? (
            <div className={styles.vuoto}>
              <p>Non risultano iscrizioni ad appelli in programma.</p>
              <p>
                Gli appelli sono in <Link href="/esami">Esami e iscrizioni</Link> e nella pagina di
                ogni corso.
              </p>
            </div>
          ) : (
            <ul className={styles.elenco}>
              {esami.map((a) => {
                const corso = a.appello.corso as Corso
                return (
                  <li key={a.appello.id}>
                    <SchedaAppello
                      titolo={<Link href={`/corsi/${corso.slug}`}>{corso.titolo}</Link>}
                      giorno={giornoAppello(a.appello.data)}
                      ora={a.appello.ora}
                      aula={a.appello.aula}
                      commissione={a.appello.commissione}
                      note={a.appello.note}
                    >
                      <IscrizioneCorso
                        compatto
                        tipo="esame"
                        idRiferimento={a.appello.id}
                        stato={a.stato}
                        chiusura={a.chiusura}
                        utente="studente"
                        iscrizioneId={a.iscrizioneId}
                      />
                    </SchedaAppello>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {studente ? (
        <section id="guida" aria-labelledby="guida-titolo" className={styles.sezione}>
          <h2 id="guida-titolo">Guida per gli studenti</h2>
          <Fisarmonica
            voci={GUIDA_STUDENTI.map((v) => ({
              id: v.id,
              titolo: v.titolo,
              contenuto: (
                <>
                  <ol className={styles.passi}>
                    {v.passi.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                  {v.id === 'isidata' ? (
                    <p>
                      <a href={LINK_ISIDATA} target="_blank" rel="noreferrer">
                        Vai a Isidata (si apre in una nuova scheda)
                      </a>
                    </p>
                  ) : null}
                </>
              ),
            }))}
          />
        </section>
      ) : null}
    </div>
  )
}
