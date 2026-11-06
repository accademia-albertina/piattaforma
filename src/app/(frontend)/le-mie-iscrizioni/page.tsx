import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LIVELLO_LABELS } from '@/access/corsi'
import { datiStudente } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { urlAccesso } from '@/auth/google'
import { Breadcrumbs, IscrizioneCorso, TestataPagina } from '@/components'
import { docentiDi, etichettaLivelli } from '@/lib/corsi'
import { dataIscrizioni, iscrizioniDelCorso } from '@/lib/iscrizioni'
import { payloadClient } from '@/lib/payload'

import styles from './iscrizioni.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Le mie iscrizioni',
  robots: { index: false },
}

/** Area dello studente: i corsi a cui è iscritto, con la possibilità di annullare finché la finestra è aperta. */
export default async function LeMieIscrizioni() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(urlAccesso('/le-mie-iscrizioni'))

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

  return (
    <div className={`container ${styles.pagina}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Le mie iscrizioni' }]} />
      <TestataPagina
        occhiello="Area riservata"
        titolo="Le mie iscrizioni"
        sommario={
          studente
            ? `${nome || user.email}, matricola ${studente.matricola}, ${LIVELLO_LABELS[studente.livello].toLowerCase()}.`
            : 'Questa pagina è per gli studenti: si accede con l’account 12345t@ o 12345b@.'
        }
      />

      {studente ? (
        <section aria-labelledby="corsi-iscritti" className={styles.sezione}>
          <h2 id="corsi-iscritti">Corsi</h2>
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
                      corsoId={corso.id}
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
    </div>
  )
}
