'use client'

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'

import type { StatoPrenotazione } from '@/lib/sportello'

type Props = {
  id: number
  stato: StatoPrenotazione
  etichette: Record<StatoPrenotazione, string>
  /** L'orario è passato: niente annullamento, solo ritirato / non presentato. */
  passato?: boolean
}

/**
 * Azioni della segreteria su un appuntamento: Ritirato, Non presentato, Annulla (con motivo
 * facoltativo, la persona riceve un'email). Uno stato già segnato si può riportare a “Prenotata”.
 */
export default function AzioniAppuntamento({ id, stato, etichette, passato = false }: Props) {
  const router = useRouter()
  const motivoId = useId()
  const [inCorso, setInCorso] = useState(false)
  const [annulla, setAnnulla] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [errore, setErrore] = useState<string | null>(null)

  async function salva(dati: Record<string, string>) {
    setInCorso(true)
    setErrore(null)
    try {
      const r = await fetch(`/api/prenotazioni-segreteria/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dati),
      })
      if (!r.ok) {
        const corpo = (await r.json().catch(() => ({}))) as { errors?: { message?: string }[] }
        throw new Error(corpo.errors?.[0]?.message ?? 'Non riuscito. Riprova.')
      }
      setAnnulla(false)
      router.refresh()
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInCorso(false)
    }
  }

  if (stato !== 'prenotata') {
    return (
      <div className="azioni-appuntamento">
        <span className={`stato-appuntamento stato-appuntamento--${stato}`}>{etichette[stato]}</span>
        {stato !== 'annullata' && (
          <button
            type="button"
            className="azioni-appuntamento__link"
            disabled={inCorso}
            onClick={() => salva({ stato: 'prenotata' })}
          >
            Annulla la segnatura
          </button>
        )}
        {errore && <span role="alert">{errore}</span>}
      </div>
    )
  }

  return (
    <div className="azioni-appuntamento">
      <div className="azioni-appuntamento__pulsanti">
        <button
          type="button"
          className="btn btn--style-primary btn--size-small"
          disabled={inCorso}
          onClick={() => salva({ stato: 'ritirata' })}
        >
          Ritirato
        </button>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          disabled={inCorso}
          onClick={() => salva({ stato: 'assente' })}
        >
          Non presentato
        </button>
        {!passato && (
          <button
            type="button"
            className="azioni-appuntamento__link"
            aria-expanded={annulla}
            disabled={inCorso}
            onClick={() => setAnnulla((v) => !v)}
          >
            Annulla…
          </button>
        )}
      </div>
      {annulla && (
        <div className="azioni-appuntamento__annulla">
          <label htmlFor={motivoId}>Motivo (va nell’email, facoltativo)</label>
          <input
            id={motivoId}
            type="text"
            value={motivo}
            maxLength={200}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--style-primary btn--size-small"
            disabled={inCorso}
            onClick={() => salva({ stato: 'annullata', motivoAnnullamento: motivo })}
          >
            Annulla l’appuntamento e avvisa
          </button>
        </div>
      )}
      {errore && <span role="alert">{errore}</span>}
    </div>
  )
}
