import type { AdminViewServerProps, Where } from 'payload'

import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gestisceSportello } from '@/access/sportello'
import { leggiImpostazioni, STATO_LABELS, type StatoPrenotazione } from '@/lib/sportello'
import {
  aggiungiGiorni,
  etichettaAppuntamento,
  etichettaGiorno,
  festivita,
  giornoChiuso,
  giornoRoma,
  istanteRoma,
  oraRoma,
  turniDelGiorno,
} from '@/lib/sportello-orari'
import type { PrenotazioneSegreteria } from '@/payload-types'

import AzioniAppuntamento from './AzioniAppuntamento'
import PassoPannello from './PassoPannello'
import StampaAgenda from './StampaAgenda'

import styles from './AgendaSportello.module.css'

const GIORNO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Elenco degli appuntamenti allo sportello (al posto dell'elenco standard della collezione):
 * un giorno alla volta, con le azioni Ritirato / Non presentato / Annulla e la stampa.
 * Con la ricerca mostra gli appuntamenti di una persona.
 */
export default async function AgendaSportello({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const admin = req.payload.config.routes.admin
  const base = `${admin}/collections/prenotazioni-segreteria`
  if (!req.user) redirect(`${admin}/login?redirect=${base}`)
  if (!gestisceSportello(req.user)) redirect(admin)

  const imp = await leggiImpostazioni(req.payload, req)
  const oggi = giornoRoma(new Date())
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''
  const richiesto = typeof searchParams?.giorno === 'string' ? searchParams.giorno : ''

  // Giorni con turni o con appuntamenti, per scorrere avanti e indietro
  const dal = aggiungiGiorni(richiesto && GIORNO.test(richiesto) ? richiesto : oggi, -90)
  const al = aggiungiGiorni(richiesto && GIORNO.test(richiesto) ? richiesto : oggi, 120)
  const { docs: vicini } = await req.payload.find({
    collection: 'prenotazioni-segreteria',
    where: {
      inizio: {
        greater_than_equal: istanteRoma(dal, '00:00').toISOString(),
        less_than: istanteRoma(al, '23:59').toISOString(),
      },
    },
    select: { inizio: true },
    pagination: false,
    depth: 0,
    req,
  })
  const conAppuntamenti = new Set(vicini.map((p) => giornoRoma(new Date(p.inizio))))
  const utile = (g: string) => conAppuntamenti.has(g) || turniDelGiorno(g, imp).length > 0
  const cerca = (da: string, verso: 1 | -1) => {
    for (let i = 1; i <= 90; i++) {
      const g = aggiungiGiorni(da, i * verso)
      if (utile(g)) return g
    }
    return null
  }

  const giorno =
    richiesto && GIORNO.test(richiesto) ? richiesto : utile(oggi) ? oggi : (cerca(oggi, 1) ?? oggi)
  const precedente = cerca(giorno, -1)
  const successivo = cerca(giorno, 1)

  const where: Where = q
    ? {
        or: [
          { nominativo: { like: q } },
          { email: { like: q.toLowerCase() } },
          { matricola: { equals: q } },
        ],
      }
    : {
        inizio: {
          greater_than_equal: istanteRoma(giorno, '00:00').toISOString(),
          less_than: istanteRoma(aggiungiGiorni(giorno, 1), '00:00').toISOString(),
        },
      }
  const { docs } = (await req.payload.find({
    collection: 'prenotazioni-segreteria',
    where,
    sort: q ? '-inizio' : 'inizio',
    limit: q ? 50 : 500,
    depth: 0,
    req,
  })) as { docs: PrenotazioneSegreteria[] }

  const attivi = docs.filter((p) => p.stato !== 'annullata')
  const annullati = docs.filter((p) => p.stato === 'annullata')
  const turni = turniDelGiorno(giorno, imp)
  const capienza = turni.length * Math.max(1, imp.personePerTurno || 1)
  const festa = festivita(giorno)
  const chiuso = festa ? { motivo: festa } : giornoChiuso(giorno, imp.chiusure ?? [])
  const daRitirare = attivi.filter((p) => p.stato === 'prenotata').length

  const riga = (p: PrenotazioneSegreteria, conGiorno = false) => (
    <tr key={p.id} data-stato={p.stato}>
      <td className={styles.ora}>
        {conGiorno ? etichettaAppuntamento(p.inizio) : oraRoma(new Date(p.inizio))}
      </td>
      <td>
        <Link href={`${base}/${p.id}`} className={styles.nome}>
          {p.nominativo || p.email}
        </Link>
        <span className={styles.secondario}>
          {p.tipo === 'esterno' ? 'Esterno · ' : ''}
          {p.email}
        </span>
      </td>
      <td>{p.matricola || '—'}</td>
      <td>{p.documento}</td>
      <td className={styles.telefono}>{p.telefono || '—'}</td>
      <td>
        <AzioniAppuntamento
          id={p.id}
          stato={(p.stato ?? 'prenotata') as StatoPrenotazione}
          etichette={STATO_LABELS}
          passato={new Date(p.inizio).getTime() < Date.now()}
        />
        {p.noteSegreteria && <span className={styles.secondario}>{p.noteSegreteria}</span>}
      </td>
    </tr>
  )

  const tabella = (righe: PrenotazioneSegreteria[], conGiorno = false) => (
    <div className={styles.scorri}>
      <table className={styles.tabella}>
        <thead>
          <tr>
            <th scope="col">{conGiorno ? 'Quando' : 'Ora'}</th>
            <th scope="col">Cognome e nome</th>
            <th scope="col">Matricola</th>
            <th scope="col">Documento</th>
            <th scope="col">Telefono</th>
            <th scope="col">Stato</th>
          </tr>
        </thead>
        <tbody>{righe.map((p) => riga(p, conGiorno))}</tbody>
      </table>
    </div>
  )

  return (
    <>
      <PassoPannello etichetta="Appuntamenti" />
      <Gutter className={styles.agenda}>
        <header className={styles.intestazione}>
          <div>
            <h1>Appuntamenti allo sportello</h1>
            <p>
              Chi viene a ritirare un documento. Si prenota dal sito; da qui segni chi è passato e
              annulli se serve (la persona riceve un’email).
            </p>
          </div>
          <div className={styles.azioniPagina}>
            <StampaAgenda />
            <Link className="btn btn--style-secondary btn--size-small" href={`${admin}/globals/sportello-segreteria`}>
              Orari e chiusure
            </Link>
            <Link className="btn btn--style-primary btn--size-small" href={`${base}/create`}>
              Nuovo appuntamento
            </Link>
          </div>
        </header>

        <form className={styles.cerca} action={base} role="search">
          <label htmlFor="cerca-appuntamenti">Cerca una persona</label>
          <div>
            <input
              id="cerca-appuntamenti"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cognome, email o matricola"
            />
            <button type="submit" className="btn btn--style-secondary btn--size-small">
              Cerca
            </button>
          </div>
        </form>

        {q ? (
          <section aria-labelledby="risultati">
            <h2 id="risultati" className={styles.titoloGiorno}>
              Risultati per “{q}”
            </h2>
            <p>
              <Link href={base}>Torna all’elenco del giorno</Link>
            </p>
            {docs.length ? tabella(docs, true) : <p>Nessun appuntamento trovato.</p>}
          </section>
        ) : (
          <section aria-labelledby="giorno">
            <nav className={styles.giorni} aria-label="Scegli il giorno">
              {precedente ? (
                <Link href={`${base}?giorno=${precedente}`}>← {etichettaGiorno(precedente)}</Link>
              ) : (
                <span />
              )}
              <form action={base} className={styles.sceltaGiorno}>
                <label htmlFor="giorno-agenda" className="visually-hidden">
                  Vai al giorno
                </label>
                <input id="giorno-agenda" type="date" name="giorno" defaultValue={giorno} />
                <button type="submit" className="btn btn--style-secondary btn--size-small">
                  Vai
                </button>
                {giorno !== oggi && <Link href={`${base}?giorno=${oggi}`}>Oggi</Link>}
              </form>
              {successivo ? (
                <Link href={`${base}?giorno=${successivo}`}>{etichettaGiorno(successivo)} →</Link>
              ) : (
                <span />
              )}
            </nav>

            <h2 id="giorno" className={styles.titoloGiorno}>
              {etichettaGiorno(giorno)}
              {giorno === oggi && <span className={styles.oggi}>Oggi</span>}
            </h2>
            <p className={styles.riepilogo}>
              {chiuso
                ? `Sportello chiuso${chiuso.motivo ? `: ${chiuso.motivo}` : ''}.`
                : turni.length
                  ? `${attivi.length} appuntamenti su ${capienza} posti · ${daRitirare} da ricevere · orario ${turni[0]}–${oraFine(turni, imp.durataTurno || 5)}`
                  : 'Nessun turno in orario questo giorno.'}
            </p>

            {attivi.length ? (
              tabella(attivi)
            ) : (
              <p className={styles.vuoto}>Nessun appuntamento.</p>
            )}

            {annullati.length > 0 && (
              <details className={styles.annullati}>
                <summary>Annullati ({annullati.length})</summary>
                {tabella(annullati)}
              </details>
            )}
          </section>
        )}
      </Gutter>
    </>
  )
}

function oraFine(turni: string[], durata: number) {
  const [h, m] = turni[turni.length - 1].split(':').map(Number)
  const fine = h * 60 + m + durata
  return `${String(Math.floor(fine / 60)).padStart(2, '0')}:${String(fine % 60).padStart(2, '0')}`
}
