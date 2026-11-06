'use client'

import { useState } from 'react'

import { Alert } from '../Alert/Alert'
import { Button, classiPulsante } from '../Button/Button'

import styles from './IscrizioneCorso.module.css'

export type StatoIscrizioni = 'nessuna' | 'prima' | 'aperta' | 'chiusa'

export type IscrizioneCorsoProps = {
  corsoId: number
  stato: StatoIscrizioni
  /** Date già formattate (“12 febbraio 2027, 23:59”). */
  apertura?: string
  chiusura?: string
  /** Chi guarda: non ha fatto l'accesso, è uno studente, oppure è personale. */
  utente: 'anonimo' | 'studente' | 'altro'
  /** Il corso è del livello dello studente (triennio o biennio). */
  livelloAmmesso?: boolean
  /** Id dell'iscrizione se lo studente è già iscritto. */
  iscrizioneId?: number | null
  /** Dove si accede (con ritorno a questa pagina). */
  accessoHref?: string
  /** Livello del titolo del riquadro. */
  livelloTitolo?: 2 | 3
  /** Senza titolo né descrizione: solo stato e pulsante (elenco “Le mie iscrizioni”). */
  compatto?: boolean
}

type ErroriPayload = { errors?: { message?: string }[]; message?: string }

async function messaggioErrore(r: Response) {
  const corpo = (await r.json().catch(() => ({}))) as ErroriPayload
  return corpo.errors?.[0]?.message ?? corpo.message ?? 'Operazione non riuscita. Riprova.'
}

/**
 * Iscrizione a un corso dal sito: stato della finestra e pulsante “Iscriviti” o
 * “Annulla l’iscrizione”. Le regole (finestra, livello, doppioni) le controlla il server.
 */
export function IscrizioneCorso({
  corsoId,
  stato,
  apertura,
  chiusura,
  utente,
  livelloAmmesso = true,
  iscrizioneId: iniziale = null,
  accessoHref = '/admin/login',
  livelloTitolo = 2,
  compatto = false,
}: IscrizioneCorsoProps) {
  const [iscrizioneId, setIscrizioneId] = useState<number | null>(iniziale)
  const [inCorso, setInCorso] = useState(false)
  const [conferma, setConferma] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [esito, setEsito] = useState<string | null>(null)
  const Titolo = `h${livelloTitolo}` as const
  const aperta = stato === 'aperta'

  async function iscriviti() {
    setInCorso(true)
    setErrore(null)
    setEsito(null)
    try {
      const r = await fetch('/api/iscrizioni-corsi', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corso: corsoId }),
      })
      if (!r.ok) throw new Error(await messaggioErrore(r))
      const { doc } = (await r.json()) as { doc: { id: number } }
      setIscrizioneId(doc.id)
      setEsito('Iscrizione registrata.')
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  async function annulla() {
    if (!iscrizioneId) return
    setInCorso(true)
    setErrore(null)
    setEsito(null)
    try {
      const r = await fetch(`/api/iscrizioni-corsi/${iscrizioneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!r.ok) throw new Error(await messaggioErrore(r))
      setIscrizioneId(null)
      setConferma(false)
      setEsito('Iscrizione annullata.')
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  let testo: string
  if (iscrizioneId) {
    testo = aperta
      ? `La tua iscrizione è registrata. Puoi annullarla fino al ${chiusura}.`
      : 'La tua iscrizione è registrata. Le iscrizioni sono chiuse: per annullarla scrivi alla segreteria.'
  } else if (stato === 'nessuna') {
    testo = 'Le date delle iscrizioni non sono ancora pubblicate.'
  } else if (stato === 'prima') {
    testo = `Le iscrizioni si aprono il ${apertura} e chiudono il ${chiusura}.`
  } else if (stato === 'chiusa') {
    testo = `Le iscrizioni si sono chiuse il ${chiusura}.`
  } else if (utente === 'studente' && !livelloAmmesso) {
    testo = 'Questo corso non è del tuo livello (triennio o biennio): non puoi iscriverti.'
  } else if (utente === 'altro') {
    testo = `Iscrizioni aperte fino al ${chiusura}. Si iscrivono gli studenti con l’account istituzionale.`
  } else {
    testo = `Iscrizioni aperte fino al ${chiusura}.`
  }

  return (
    <section
      className={compatto ? styles.compatto : styles.riquadro}
      aria-label={compatto ? 'Iscrizione' : undefined}
      aria-labelledby={compatto ? undefined : `iscrizione-${corsoId}`}
    >
      {compatto ? null : (
        <Titolo id={`iscrizione-${corsoId}`} className={styles.titolo}>
          Iscrizione al corso
        </Titolo>
      )}
      <p className={styles.testo}>{testo}</p>

      {aperta && !iscrizioneId && utente === 'anonimo' ? (
        <a href={accessoHref} className={classiPulsante.primary}>
          Accedi per iscriverti
        </a>
      ) : null}

      {aperta && !iscrizioneId && utente === 'studente' && livelloAmmesso ? (
        <Button onPress={iscriviti} isPending={inCorso}>
          {inCorso ? 'Iscrizione in corso…' : 'Iscriviti al corso'}
        </Button>
      ) : null}

      {aperta && iscrizioneId && !conferma ? (
        <Button variant="secondary" onPress={() => setConferma(true)}>
          Annulla l’iscrizione
        </Button>
      ) : null}

      {aperta && iscrizioneId && conferma ? (
        <div className={styles.conferma} role="group" aria-label="Conferma l’annullamento">
          <p className={styles.testo}>Vuoi davvero annullare l’iscrizione?</p>
          <div className={styles.azioni}>
            <Button onPress={annulla} isPending={inCorso}>
              Sì, annulla
            </Button>
            <Button variant="secondary" onPress={() => setConferma(false)}>
              No, mantienila
            </Button>
          </div>
        </div>
      ) : null}

      <div aria-live="polite" className={styles.esito}>
        {esito ? <p className={styles.testo}>{esito}</p> : null}
      </div>
      {errore ? (
        <Alert tone="error" title="Non è stato possibile completare l’operazione" live>
          <p>{errore}</p>
        </Alert>
      ) : null}
    </section>
  )
}
