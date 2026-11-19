import type { ListViewServerProps, Where } from 'payload'

import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { gestisceSportello } from '@/access/sportello'
import { adesso, leggiImpostazioni, STATO_LABELS, type StatoPrenotazione } from '@/lib/sportello'
import {
  aggiungiGiorni,
  etichettaAppuntamento,
  etichettaGiorno,
  festivita,
  giornoChiuso,
  giornoRoma,
  giornoSettimana,
  istanteRoma,
  oraRoma,
  turniDelGiorno,
} from '@/lib/sportello-orari'
import type { PrenotazioneSegreteria } from '@/payload-types'

import { IntestazioneStampa } from '@/components/IntestazioneStampa/IntestazioneStampa'

import AzioniAppuntamento from './AzioniAppuntamento'
import PassoPannello from './PassoPannello'
import StampaAgenda from './StampaAgenda'

import styles from './AgendaSportello.module.css'

const GIORNO = /^\d{4}-\d{2}-\d{2}$/

type Vista = 'giorno' | 'settimana' | 'mese'
const VISTE: { id: Vista; etichetta: string }[] = [
  { id: 'giorno', etichetta: 'Giorno' },
  { id: 'settimana', etichetta: 'Settimana' },
  { id: 'mese', etichetta: 'Mese' },
]
const INTESTAZIONI_SETTIMANA = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']

const breve = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const meseAnno = new Intl.DateTimeFormat('it-IT', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const utc = (g: string) => {
  const [a, m, d] = g.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}
/** "lun 16 nov" */
const etichettaBreve = (g: string) => breve.format(utc(g)).replace(/\./g, '')
const lunediDi = (g: string) => aggiungiGiorni(g, 1 - giornoSettimana(g))
const primoDelMese = (g: string) => `${g.slice(0, 8)}01`
const spostaMese = (g: string, n: number) => {
  const d = utc(primoDelMese(g))
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Elenco degli appuntamenti allo sportello (al posto dell'elenco standard della collezione):
 * per giorno, settimana o mese, con le azioni Ritirato / Non presentato / Annulla e la stampa.
 * Con la ricerca mostra gli appuntamenti di una persona.
 */
export default async function AgendaSportello({
  payload,
  user,
  searchParams,
}: ListViewServerProps) {
  const admin = payload.config.routes.admin
  const base = `${admin}/collections/prenotazioni-segreteria`
  if (!user) redirect(`${admin}/login?redirect=${base}`)
  if (!gestisceSportello(user)) redirect(admin)
  // Accesso già verificato qui sopra: le letture sotto (overrideAccess) valgono per la segreteria

  const imp = await leggiImpostazioni(payload)
  const oggi = giornoRoma(new Date())
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''
  const richiesto = typeof searchParams?.giorno === 'string' ? searchParams.giorno : ''
  const vista: Vista =
    searchParams?.vista === 'settimana' || searchParams?.vista === 'mese'
      ? searchParams.vista
      : 'giorno'
  const url = (g: string, v: Vista = vista) =>
    `${base}?giorno=${g}${v === 'giorno' ? '' : `&vista=${v}`}`

  // Giorni con turni o con appuntamenti, per scorrere avanti e indietro
  const dal = aggiungiGiorni(richiesto && GIORNO.test(richiesto) ? richiesto : oggi, -90)
  const al = aggiungiGiorni(richiesto && GIORNO.test(richiesto) ? richiesto : oggi, 120)
  const { docs: vicini } = await payload.find({
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
    overrideAccess: true,
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
  // Periodo mostrato e frecce avanti/indietro, secondo la vista
  const periodo =
    vista === 'settimana'
      ? (() => {
          const da = lunediDi(giorno)
          const a = aggiungiGiorni(da, 6)
          return {
            da,
            a,
            precedente: aggiungiGiorni(da, -7),
            successivo: aggiungiGiorni(da, 7),
            etichettaPrec: 'Settimana prima',
            etichettaSucc: 'Settimana dopo',
          }
        })()
      : vista === 'mese'
        ? (() => {
            const da = primoDelMese(giorno)
            const a = aggiungiGiorni(spostaMese(da, 1), -1)
            const precedente = spostaMese(da, -1)
            const successivo = spostaMese(da, 1)
            return {
              da,
              a,
              precedente,
              successivo,
              etichettaPrec: meseAnno.format(utc(precedente)),
              etichettaSucc: meseAnno.format(utc(successivo)),
            }
          })()
        : (() => {
            const precedente = cerca(giorno, -1)
            const successivo = cerca(giorno, 1)
            return {
              da: giorno,
              a: giorno,
              precedente,
              successivo,
              etichettaPrec: precedente ? etichettaBreve(precedente) : '',
              etichettaSucc: successivo ? etichettaBreve(successivo) : '',
            }
          })()

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
          greater_than_equal: istanteRoma(periodo.da, '00:00').toISOString(),
          less_than: istanteRoma(aggiungiGiorni(periodo.a, 1), '00:00').toISOString(),
        },
      }
  const { docs } = (await payload.find({
    collection: 'prenotazioni-segreteria',
    where,
    sort: q ? '-inizio' : 'inizio',
    limit: q ? 50 : 5000,
    depth: 0,
    overrideAccess: true,
  })) as { docs: PrenotazioneSegreteria[] }

  // Appuntamenti per giorno e riepilogo di ogni giorno del periodo
  const perGiorno = new Map<string, PrenotazioneSegreteria[]>()
  for (const p of docs) {
    const g = giornoRoma(new Date(p.inizio))
    perGiorno.set(g, [...(perGiorno.get(g) ?? []), p])
  }
  const datiGiorno = (g: string) => {
    const tutti = perGiorno.get(g) ?? []
    const attivi = tutti.filter((p) => p.stato !== 'annullata')
    const turni = turniDelGiorno(g, imp)
    const festa = festivita(g)
    return {
      attivi,
      annullati: tutti.filter((p) => p.stato === 'annullata'),
      turni,
      capienza: turni.length * Math.max(1, imp.personePerTurno || 1),
      chiuso: festa ? { motivo: festa } : giornoChiuso(g, imp.chiusure ?? []),
      daRitirare: attivi.filter((p) => p.stato === 'prenotata').length,
    }
  }
  const riepilogo = (d: ReturnType<typeof datiGiorno>) =>
    d.chiuso
      ? `Sportello chiuso${d.chiuso.motivo ? `: ${d.chiuso.motivo}` : ''}.`
      : d.turni.length
        ? `${d.attivi.length} appuntamenti su ${d.capienza} posti · ${d.daRitirare} da ricevere · orario ${d.turni[0]}–${oraFine(d.turni, imp.durataTurno || 5)}`
        : 'Nessun turno in orario questo giorno.'
  const giorniPeriodo: string[] = []
  for (let g = periodo.da; g <= periodo.a; g = aggiungiGiorni(g, 1)) giorniPeriodo.push(g)

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
      <td data-etichetta="Matricola" data-vuoto={!p.matricola || undefined}>
        {p.matricola || '—'}
      </td>
      <td data-etichetta="Documento">{p.documento}</td>
      <td
        className={styles.telefono}
        data-etichetta="Telefono"
        data-vuoto={!p.telefono || undefined}
      >
        {p.telefono || '—'}
      </td>
      <td>
        <AzioniAppuntamento
          id={p.id}
          stato={(p.stato ?? 'prenotata') as StatoPrenotazione}
          etichette={STATO_LABELS}
          passato={new Date(p.inizio).getTime() < adesso()}
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
        <IntestazioneStampa />
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
            <Link
              className="btn btn--style-secondary btn--size-small"
              href={`${admin}/globals/sportello-segreteria`}
            >
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
          <section aria-labelledby="periodo">
            <nav className={styles.viste} aria-label="Vista">
              {VISTE.map((v) => (
                <Link
                  key={v.id}
                  href={url(giorno, v.id)}
                  aria-current={v.id === vista ? 'page' : undefined}
                >
                  {v.etichetta}
                </Link>
              ))}
            </nav>

            <nav className={styles.giorni} aria-label="Scegli il periodo">
              {periodo.precedente ? (
                <Link className={styles.precedente} href={url(periodo.precedente)}>
                  ← {periodo.etichettaPrec}
                </Link>
              ) : (
                <span className={styles.precedente} />
              )}
              <form action={base} className={styles.sceltaGiorno}>
                {vista !== 'giorno' && <input type="hidden" name="vista" value={vista} />}
                <label htmlFor="giorno-agenda" className="visually-hidden">
                  Vai al giorno
                </label>
                <input id="giorno-agenda" type="date" name="giorno" defaultValue={giorno} />
                <button type="submit" className="btn btn--style-secondary btn--size-small">
                  Vai
                </button>
                {!giorniPeriodo.includes(oggi) && <Link href={url(oggi)}>Oggi</Link>}
              </form>
              {periodo.successivo ? (
                <Link className={styles.successivo} href={url(periodo.successivo)}>
                  {periodo.etichettaSucc} →
                </Link>
              ) : (
                <span className={styles.successivo} />
              )}
            </nav>

            {vista === 'giorno' &&
              (() => {
                const d = datiGiorno(giorno)
                return (
                  <>
                    <h2 id="periodo" className={styles.titoloGiorno}>
                      {etichettaGiorno(giorno)}
                      {giorno === oggi && <span className={styles.oggi}>Oggi</span>}
                    </h2>
                    <p className={styles.riepilogo}>{riepilogo(d)}</p>
                    {d.attivi.length ? (
                      tabella(d.attivi)
                    ) : (
                      <p className={styles.vuoto}>Nessun appuntamento.</p>
                    )}
                    {d.annullati.length > 0 && (
                      <details className={styles.annullati}>
                        <summary>Annullati ({d.annullati.length})</summary>
                        {tabella(d.annullati)}
                      </details>
                    )}
                  </>
                )
              })()}

            {vista === 'settimana' && (
              <>
                <h2 id="periodo" className={styles.titoloGiorno}>
                  Settimana dal {etichettaBreve(periodo.da)} al {etichettaBreve(periodo.a)}
                </h2>
                <p className={styles.riepilogo}>
                  {docs.filter((p) => p.stato !== 'annullata').length} appuntamenti in settimana
                </p>
                {giorniPeriodo
                  .filter((g) => (perGiorno.get(g)?.length ?? 0) > 0 || datiGiorno(g).turni.length)
                  .map((g) => {
                    const d = datiGiorno(g)
                    return (
                      <section key={g} className={styles.giornoSettimana}>
                        <h3>
                          <Link href={url(g, 'giorno')}>{etichettaGiorno(g)}</Link>
                          {g === oggi && <span className={styles.oggi}>Oggi</span>}
                        </h3>
                        <p className={styles.riepilogo}>{riepilogo(d)}</p>
                        {d.attivi.length ? (
                          tabella(d.attivi)
                        ) : (
                          <p className={styles.vuoto}>Nessun appuntamento.</p>
                        )}
                      </section>
                    )
                  })}
                {giorniPeriodo.every(
                  (g) => !(perGiorno.get(g)?.length ?? 0) && !datiGiorno(g).turni.length,
                ) && <p className={styles.vuoto}>Sportello chiuso tutta la settimana.</p>}
              </>
            )}

            {vista === 'mese' && (
              <>
                <h2 id="periodo" className={styles.titoloGiorno}>
                  {meseAnno.format(utc(periodo.da))}
                </h2>
                <p className={styles.riepilogo}>
                  {docs.filter((p) => p.stato !== 'annullata').length} appuntamenti nel mese. Tocca
                  un giorno per vedere l’elenco.
                </p>
                <table className={styles.mese}>
                  <thead>
                    <tr>
                      {INTESTAZIONI_SETTIMANA.map((n) => (
                        <th key={n} scope="col">
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      {
                        length: Math.ceil(
                          (giornoSettimana(periodo.da) - 1 + giorniPeriodo.length) / 7,
                        ),
                      },
                      (_, r) => (
                        <tr key={r}>
                          {Array.from({ length: 7 }, (_, c) => {
                            const g = aggiungiGiorni(lunediDi(periodo.da), r * 7 + c)
                            if (g < periodo.da || g > periodo.a) return <td key={c} />
                            const d = datiGiorno(g)
                            const pieno = d.capienza > 0 && d.attivi.length >= d.capienza
                            return (
                              <td
                                key={c}
                                data-oggi={g === oggi || undefined}
                                data-chiuso={(!d.turni.length && !d.attivi.length) || undefined}
                              >
                                <Link
                                  href={url(g, 'giorno')}
                                  aria-label={`${etichettaGiorno(g)}: ${riepilogo(d)}`}
                                >
                                  <span className={styles.numero}>{Number(g.slice(8))}</span>
                                  {d.chiuso ? (
                                    <span className={styles.conteggio}>chiuso</span>
                                  ) : d.turni.length || d.attivi.length ? (
                                    <span
                                      className={styles.conteggio}
                                      data-pieno={pieno || undefined}
                                    >
                                      {d.attivi.length}
                                      <span className={styles.capienza}>/{d.capienza}</span>
                                    </span>
                                  ) : null}
                                </Link>
                              </td>
                            )
                          })}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </>
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
