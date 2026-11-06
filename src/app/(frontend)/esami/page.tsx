import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Where } from 'payload'

import { LIVELLI, LIVELLO_LABELS, type Livello } from '@/access/corsi'
import { datiStudente } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { urlAccesso } from '@/auth/google'
import { Breadcrumbs, IscrizioneCorso, SchedaAppello, TestataPagina } from '@/components'
import { appelliConStato, giornoAppello } from '@/lib/appelli'
import { docentiDi, etichettaLivelli } from '@/lib/corsi'
import { payloadClient } from '@/lib/payload'
import type { Corso } from '@/payload-types'

import styles from './esami.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Esami e iscrizioni',
  description:
    'Gli appelli d’esame dell’Accademia Albertina con data, ora, aula e commissione. Gli studenti si iscrivono da qui.',
  alternates: { canonical: '/esami' },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const primo = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * Calendario esami dal vivo: gli appelli futuri, raggruppati per giorno, con l'iscrizione.
 * Sostituisce il PDF della sessione; la segreteria li compila nel pannello (Appelli d'esame).
 */
export default async function EsamiPage({ searchParams }: Props) {
  const params = await searchParams
  const livelloParam = primo(params.livello)
  const livello = (LIVELLI as readonly string[]).includes(livelloParam ?? '')
    ? (livelloParam as Livello)
    : undefined
  const q = primo(params.q)?.trim().slice(0, 80) || undefined

  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const studente = hasRole(user, 'studente') ? datiStudente(user?.email) : null
  const chiGuarda = !user ? 'anonimo' : studente ? 'studente' : 'altro'
  // Lo studente vede di partenza gli appelli del suo livello
  const filtroLivello = livello ?? (params.livello === undefined ? studente?.livello : undefined)

  const condizioni: Where[] = []
  if (filtroLivello) condizioni.push({ livelli: { contains: filtroLivello } })
  if (q) {
    condizioni.push({
      or: [{ titolo: { like: q } }, { commissione: { like: q } }, { aula: { like: q } }],
    })
  }
  const appelli = await appelliConStato(payload, condizioni.length ? { and: condizioni } : {}, user)

  const giorni = new Map<string, typeof appelli>()
  for (const a of appelli) {
    const g = giornoAppello(a.appello.data)
    giorni.set(g, [...(giorni.get(g) ?? []), a])
  }

  const hrefLivello = (l?: string) => {
    const s = new URLSearchParams()
    s.set('livello', l ?? 'tutti')
    if (q) s.set('q', q)
    return `/esami?${s}`
  }

  return (
    <div className={`container ${styles.pagina}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Orari e calendari', href: '/calendari' },
          { label: 'Esami e iscrizioni' },
        ]}
      />
      <TestataPagina
        occhiello="Didattica"
        titolo="Esami e iscrizioni"
        sommario="Gli appelli in programma con data, ora, aula e commissione. Per iscriverti accedi con l’account istituzionale e premi “Iscriviti all’appello”."
      />

      <form className={styles.filtri} action="/esami" role="search">
        <nav aria-label="Livello" className={styles.livelli}>
          {[undefined, ...LIVELLI].map((l) => (
            <Link
              key={l ?? 'tutti'}
              href={hrefLivello(l)}
              aria-current={filtroLivello === l ? 'page' : undefined}
            >
              {l ? LIVELLO_LABELS[l] : 'Tutti'}
            </Link>
          ))}
        </nav>
        <input type="hidden" name="livello" value={filtroLivello ?? 'tutti'} />
        <label className={styles.cerca}>
          <span>Cerca corso, docente o aula</span>
          <span className={styles.campo}>
            <input type="search" name="q" defaultValue={q} />
            <button type="submit" className="btn btn-primario">
              Cerca
            </button>
          </span>
        </label>
      </form>

      {giorni.size === 0 ? (
        <p className={styles.vuoto}>
          Nessun appello in programma{q || filtroLivello ? ' con questi filtri' : ''}. I calendari
          delle sessioni passate sono in <Link href="/calendari">Orari e calendari</Link>.
        </p>
      ) : (
        [...giorni].map(([giorno, voci]) => (
          <section key={giorno} className={styles.giorno} aria-label={giorno}>
            <h2>{giorno}</h2>
            <ul className={styles.elenco}>
              {voci.map((a) => {
                const corso = a.appello.corso as Corso
                return (
                  <li key={a.appello.id}>
                    <SchedaAppello
                      titolo={<Link href={`/corsi/${corso.slug}`}>{corso.titolo}</Link>}
                      ora={a.appello.ora}
                      aula={a.appello.aula}
                      livelli={etichettaLivelli(a.appello.livelli ?? [])}
                      docenti={docentiDi(corso)
                        .map((d) => d.nomeCompleto)
                        .join(', ')}
                      commissione={a.appello.commissione}
                      note={a.appello.note}
                    >
                      <IscrizioneCorso
                        compatto
                        tipo="esame"
                        idRiferimento={a.appello.id}
                        stato={a.stato}
                        apertura={a.apertura}
                        chiusura={a.chiusura}
                        utente={chiGuarda}
                        livelloAmmesso={a.livelloAmmesso}
                        iscrizioneId={a.iscrizioneId}
                        accessoHref={urlAccesso('/esami')}
                      />
                    </SchedaAppello>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
