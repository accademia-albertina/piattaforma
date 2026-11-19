'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FieldError, Input, Label, Radio, RadioGroup, Text, TextField } from 'react-aria-components'

import type { GiornoDisponibile } from '@/lib/sportello'
import { etichettaAppuntamento, etichettaGiorno } from '@/lib/sportello-orari'

import { Alert } from '../Alert/Alert'
import { Button, classiPulsante } from '../Button/Button'

import styles from './PrenotazioneSportello.module.css'

export type DocumentoSportello = { id: string; nome: string; descrizione?: string | null }
export type AppuntamentoSportello = { id: number; documento: string; inizio: string }

export type PrenotazioneSportelloProps = {
  /** Chi guarda: con l'account istituzionale (studente o personale) oppure senza accesso. */
  utente: { tipo: 'account'; nominativo: string; dettaglio?: string } | { tipo: 'anonimo' }
  /** Accesso con Google, con ritorno a questa pagina. */
  accessoHref: string
  attivo: boolean
  documenti: DocumentoSportello[]
  giorni: GiornoDisponibile[]
  /** Appuntamenti futuri di chi ha fatto l'accesso. */
  appuntamenti?: AppuntamentoSportello[]
}

type ErroriPayload = { errors?: { message?: string }[]; message?: string }
async function messaggioErrore(r: Response) {
  const corpo = (await r.json().catch(() => ({}))) as ErroriPayload
  return corpo.errors?.[0]?.message ?? corpo.message ?? 'Operazione non riuscita. Riprova.'
}

const API = '/api/prenotazioni-segreteria'

const breve = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const giornoBreve = (data: string) => {
  const [a, m, g] = data.split('-').map(Number)
  return breve.format(new Date(Date.UTC(a, m - 1, g)))
}

/**
 * Prenotazione di un turno allo sportello della segreteria didattica: documento, giorno,
 * orario e conferma. Con l'account istituzionale basta confermare; senza, si verifica l'email
 * con un codice di 6 cifre. Le regole (turni liberi, un appuntamento per documento) le
 * controlla il server.
 */
export function PrenotazioneSportello({
  utente,
  accessoHref,
  attivo,
  documenti,
  giorni: giorniIniziali,
  appuntamenti: appuntamentiIniziali = [],
}: PrenotazioneSportelloProps) {
  const [giorni, setGiorni] = useState(giorniIniziali)
  const [appuntamenti, setAppuntamenti] = useState(appuntamentiIniziali)
  const [documento, setDocumento] = useState<string | null>(null)
  const [data, setData] = useState<string | null>(null)
  const [inizio, setInizio] = useState<string | null>(null)
  const [dati, setDati] = useState({ nome: '', cognome: '', email: '', telefono: '' })
  const [codice, setCodice] = useState('')
  const [codiceInviatoA, setCodiceInviatoA] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [fatto, setFatto] = useState<AppuntamentoSportello | null>(null)
  const [annuncio, setAnnuncio] = useState<string | null>(null)

  const conferma = useRef<HTMLDivElement>(null)
  // Dopo la conferma la pagina si accorcia: si torna al messaggio, con il fuoco sopra
  useEffect(() => {
    if (!fatto) return
    conferma.current?.scrollIntoView({ block: 'start' })
    conferma.current?.focus()
  }, [fatto])

  const anonimo = utente.tipo === 'anonimo'
  const giorno = useMemo(() => giorni.find((g) => g.data === data) ?? null, [giorni, data])
  const nomeDocumento = documenti.find((d) => d.id === documento)?.nome

  async function aggiornaDisponibilita() {
    const r = await fetch(`${API}/disponibilita`, { credentials: 'include' })
    if (r.ok) setGiorni(((await r.json()) as { giorni: GiornoDisponibile[] }).giorni)
  }

  async function inviaCodice() {
    setInCorso(true)
    setErrore(null)
    try {
      const r = await fetch(`${API}/codice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dati.email }),
      })
      if (!r.ok) throw new Error(await messaggioErrore(r))
      setCodiceInviatoA(dati.email.trim())
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  async function prenota() {
    if (!documento || !inizio) return
    setInCorso(true)
    setErrore(null)
    try {
      const r = await fetch(`${API}/prenota`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento, inizio, ...dati, codice }),
      })
      if (!r.ok) {
        const messaggio = await messaggioErrore(r)
        if (r.status === 409) {
          setInizio(null)
          await aggiornaDisponibilita()
        }
        throw new Error(messaggio)
      }
      const { doc } = (await r.json()) as { doc: AppuntamentoSportello }
      setFatto(doc)
      if (!anonimo)
        setAppuntamenti((a) => [...a, doc].sort((x, y) => x.inizio.localeCompare(y.inizio)))
      void aggiornaDisponibilita()
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  async function disdici(id: number) {
    setInCorso(true)
    setErrore(null)
    try {
      const r = await fetch(`${API}/disdici`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!r.ok) throw new Error(await messaggioErrore(r))
      setAppuntamenti((a) => a.filter((x) => x.id !== id))
      if (fatto?.id === id) setFatto(null)
      setAnnuncio('Appuntamento disdetto. Ti abbiamo mandato un’email di conferma.')
      void aggiornaDisponibilita()
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  function ricomincia() {
    setFatto(null)
    setDocumento(null)
    setData(null)
    setInizio(null)
    setCodice('')
    setCodiceInviatoA(null)
  }

  const elencoAppuntamenti = !anonimo && appuntamenti.length > 0 && (
    <section className={styles.miei} aria-labelledby="miei-appuntamenti">
      <h2 id="miei-appuntamenti" className={styles.titoloSezione}>
        I tuoi appuntamenti
      </h2>
      <ul className={styles.elencoMiei}>
        {appuntamenti.map((a) => (
          <li key={a.id}>
            <span>
              <strong>{a.documento}</strong>
              <br />
              {etichettaAppuntamento(a.inizio)}
            </span>
            <Button variant="secondary" isDisabled={inCorso} onPress={() => disdici(a.id)}>
              Disdici
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )

  const avvisi = (
    <div aria-live="polite" className={styles.avvisi}>
      {annuncio && (
        <Alert tone="success" title="Fatto">
          <p>{annuncio}</p>
        </Alert>
      )}
    </div>
  )

  if (!attivo) {
    return (
      <div className={styles.prenotazione}>
        {elencoAppuntamenti}
        {avvisi}
        <Alert tone="warning" title="Prenotazioni sospese">
          <p>
            Al momento non si possono prenotare nuovi appuntamenti. Riprova nei prossimi giorni.
          </p>
        </Alert>
      </div>
    )
  }

  if (fatto) {
    return (
      <div className={`${styles.prenotazione} ${styles.passo}`} ref={conferma} tabIndex={-1}>
        <Alert tone="success" title="Appuntamento confermato" live>
          <p>
            <strong>{fatto.documento}</strong>, {etichettaAppuntamento(fatto.inizio)}, in segreteria
            didattica (Via Accademia Albertina 6).
          </p>
          <p>
            Ti abbiamo mandato un’email di conferma con il link per disdire. Porta un documento
            d’identità.
          </p>
        </Alert>
        <div className={styles.azioni}>
          {!anonimo && (
            <Button variant="secondary" isDisabled={inCorso} onPress={() => disdici(fatto.id)}>
              Disdici
            </Button>
          )}
          <Button variant="ghost" onPress={ricomincia}>
            Prenota un altro documento
          </Button>
        </div>
      </div>
    )
  }

  const pronti = Boolean(documento && inizio)
  const datiCompleti =
    dati.nome.trim() && dati.cognome.trim() && dati.email.trim() && dati.telefono.trim()

  return (
    <div className={styles.prenotazione}>
      {elencoAppuntamenti}
      {avvisi}

      <section className={styles.passo} aria-labelledby="passo-chi">
        <h2 id="passo-chi" className={styles.titoloSezione}>
          <span className={styles.numero} aria-hidden>
            1
          </span>
          Chi prenota
        </h2>
        {anonimo ? (
          <div className={styles.chi}>
            <div className={styles.riquadro}>
              <p className={styles.etichettaRiquadro}>Studenti iscritti</p>
              <p>
                Accedi con l’account istituzionale (12345t@ o 12345b@): i tuoi dati sono già pronti.
              </p>
              <a className={classiPulsante.primary} href={accessoHref}>
                Accedi con Google
              </a>
            </div>
            <div className={styles.riquadro}>
              <p className={styles.etichettaRiquadro}>Senza account istituzionale</p>
              <p>
                Per esempio se sei già diplomato: scegli qui sotto e lascia i tuoi dati. Ti mandiamo
                un codice via email per confermare.
              </p>
            </div>
          </div>
        ) : (
          <p className={styles.chiAccount}>
            Prenoti come <strong>{utente.nominativo}</strong>
            {utente.dettaglio ? `, ${utente.dettaglio}` : ''}.
          </p>
        )}
      </section>

      <section className={styles.passo} aria-labelledby="passo-documento">
        <RadioGroup
          value={documento}
          onChange={(v) => {
            setDocumento(v)
            setErrore(null)
          }}
          className={styles.gruppo}
          aria-labelledby="passo-documento"
        >
          <h2 id="passo-documento" className={styles.titoloSezione}>
            <span className={styles.numero} aria-hidden>
              2
            </span>
            Cosa devi ritirare
          </h2>
          <div className={styles.documenti}>
            {documenti.map((d) => (
              <Radio key={d.id} value={d.id} className={styles.scelta}>
                <span className={styles.pallino} aria-hidden />
                <span>
                  <span className={styles.nomeScelta}>{d.nome}</span>
                  {d.descrizione && <span className={styles.notaScelta}>{d.descrizione}</span>}
                </span>
              </Radio>
            ))}
          </div>
        </RadioGroup>
      </section>

      <section className={styles.passo} aria-labelledby="passo-giorno">
        {giorni.length === 0 ? (
          <>
            <h2 id="passo-giorno" className={styles.titoloSezione}>
              <span className={styles.numero} aria-hidden>
                3
              </span>
              Giorno e ora
            </h2>
            <p>Non ci sono turni prenotabili nelle prossime settimane.</p>
          </>
        ) : (
          <>
            <RadioGroup
              value={data}
              onChange={(v) => {
                setData(v)
                setInizio(null)
              }}
              className={styles.gruppo}
              aria-labelledby="passo-giorno"
              isDisabled={!documento}
            >
              <h2 id="passo-giorno" className={styles.titoloSezione}>
                <span className={styles.numero} aria-hidden>
                  3
                </span>
                Giorno e ora
              </h2>
              {!documento && <Text slot="description">Scegli prima il documento.</Text>}
              <div className={styles.giorni}>
                {giorni.map((g) => (
                  <Radio
                    key={g.data}
                    value={g.data}
                    isDisabled={g.liberi === 0}
                    className={styles.giorno}
                    aria-label={`${etichettaGiorno(g.data)}, ${g.liberi === 0 ? 'completo' : `${g.liberi} turni liberi`}`}
                  >
                    <span className={styles.dataGiorno}>{giornoBreve(g.data)}</span>
                    <span className={styles.liberi}>
                      {g.liberi === 0 ? 'Completo' : `${g.liberi} liberi`}
                    </span>
                  </Radio>
                ))}
              </div>
            </RadioGroup>

            {giorno && (
              <RadioGroup
                value={inizio}
                onChange={setInizio}
                className={styles.gruppo}
                aria-label={`Orario di ${etichettaGiorno(giorno.data)}`}
              >
                <p className={styles.sottotitolo}>{etichettaGiorno(giorno.data)}</p>
                <div className={styles.orari}>
                  {giorno.turni.map((t) => (
                    <Radio
                      key={t.inizio}
                      value={t.inizio}
                      isDisabled={t.liberi === 0}
                      className={styles.orario}
                      aria-label={t.liberi === 0 ? `${t.ora}, occupato` : t.ora}
                    >
                      {t.ora}
                    </Radio>
                  ))}
                </div>
              </RadioGroup>
            )}
          </>
        )}
      </section>

      <section className={styles.passo} aria-labelledby="passo-conferma">
        <h2 id="passo-conferma" className={styles.titoloSezione}>
          <span className={styles.numero} aria-hidden>
            4
          </span>
          {anonimo ? 'I tuoi dati e conferma' : 'Conferma'}
        </h2>

        {pronti && (
          <p className={styles.riepilogo}>
            <strong>{nomeDocumento}</strong>, {etichettaAppuntamento(inizio!)}
          </p>
        )}

        {anonimo ? (
          <div className={styles.campi}>
            <TextField
              className={styles.campo}
              isRequired
              value={dati.nome}
              onChange={(nome) => setDati((d) => ({ ...d, nome }))}
              autoComplete="given-name"
            >
              <Label>Nome</Label>
              <Input />
              <FieldError />
            </TextField>
            <TextField
              className={styles.campo}
              isRequired
              value={dati.cognome}
              onChange={(cognome) => setDati((d) => ({ ...d, cognome }))}
              autoComplete="family-name"
            >
              <Label>Cognome</Label>
              <Input />
              <FieldError />
            </TextField>
            <TextField
              className={styles.campo}
              isRequired
              type="email"
              value={dati.email}
              onChange={(email) => {
                setDati((d) => ({ ...d, email }))
                setCodiceInviatoA(null)
              }}
              autoComplete="email"
            >
              <Label>Email</Label>
              <Input />
              <Text slot="description">Qui arrivano il codice e la conferma.</Text>
              <FieldError />
            </TextField>
            <TextField
              className={styles.campo}
              isRequired
              type="tel"
              value={dati.telefono}
              onChange={(telefono) => setDati((d) => ({ ...d, telefono }))}
              autoComplete="tel"
            >
              <Label>Telefono</Label>
              <Input />
              <Text slot="description">Solo per avvisarti se l’appuntamento cambia.</Text>
              <FieldError />
            </TextField>
          </div>
        ) : (
          <div className={styles.campi}>
            <TextField
              className={styles.campo}
              type="tel"
              value={dati.telefono}
              onChange={(telefono) => setDati((d) => ({ ...d, telefono }))}
              autoComplete="tel"
            >
              <Label>Telefono (facoltativo)</Label>
              <Input />
              <Text slot="description">Solo per avvisarti se l’appuntamento cambia.</Text>
            </TextField>
          </div>
        )}

        {errore && (
          <Alert tone="error" title="Non riuscito" live>
            <p>{errore}</p>
          </Alert>
        )}

        {anonimo && !codiceInviatoA ? (
          <div className={styles.azioni}>
            <Button isDisabled={!pronti || !datiCompleti || inCorso} onPress={inviaCodice}>
              Ricevi il codice via email
            </Button>
            {!pronti && <p className={styles.nota}>Scegli documento, giorno e ora.</p>}
          </div>
        ) : (
          <div className={styles.azioni}>
            {anonimo && (
              <TextField
                className={`${styles.campo} ${styles.campoCodice}`}
                isRequired
                value={codice}
                onChange={(v) => setCodice(v.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
              >
                <Label>Codice ricevuto via email</Label>
                <Input />
                <Text slot="description">
                  L’abbiamo mandato a {codiceInviatoA}. Vale 15 minuti.{' '}
                </Text>
              </TextField>
            )}
            <div className={styles.pulsanti}>
              <Button
                isDisabled={!pronti || inCorso || (anonimo && codice.length !== 6)}
                onPress={prenota}
              >
                Conferma la prenotazione
              </Button>
              {anonimo && (
                <Button variant="ghost" isDisabled={inCorso} onPress={inviaCodice}>
                  Mandami un nuovo codice
                </Button>
              )}
            </div>
            {!pronti && <p className={styles.nota}>Scegli documento, giorno e ora.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
