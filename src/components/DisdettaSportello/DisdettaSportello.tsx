'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Alert } from '../Alert/Alert'
import { Button, classiPulsante } from '../Button/Button'

export type DisdettaSportelloProps = {
  id: number
  /** Codice del link nell'email. */
  token: string
  documento: string
  /** Giorno e ora già formattati. */
  quando: string
}

/** Conferma della disdetta di un appuntamento in segreteria dal link dell'email. */
export function DisdettaSportello({ id, token, documento, quando }: DisdettaSportelloProps) {
  const [stato, setStato] = useState<'attesa' | 'inCorso' | 'fatto'>('attesa')
  const [errore, setErrore] = useState<string | null>(null)

  async function disdici() {
    setStato('inCorso')
    setErrore(null)
    try {
      const r = await fetch('/api/prenotazioni-segreteria/disdici', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token }),
      })
      if (!r.ok) {
        const corpo = (await r.json().catch(() => ({}))) as { errors?: { message?: string }[] }
        throw new Error(corpo.errors?.[0]?.message ?? 'Non riuscito. Riprova.')
      }
      setStato('fatto')
    } catch (e) {
      setErrore((e as Error).message)
      setStato('attesa')
    }
  }

  if (stato === 'fatto') {
    return (
      <Alert tone="success" title="Appuntamento disdetto" live>
        <p>
          Il turno è di nuovo libero. Se ti serve ancora il documento{' '}
          <Link href="/prenotazioni-segreteria">prenota un altro giorno</Link>.
        </p>
      </Alert>
    )
  }

  return (
    <>
      <p>
        Vuoi disdire l’appuntamento per <strong>{documento}</strong>, {quando}?
      </p>
      {errore && (
        <Alert tone="error" title="Non riuscito" live>
          <p>{errore}</p>
        </Alert>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <Button isDisabled={stato === 'inCorso'} onPress={disdici}>
          Sì, disdici
        </Button>
        <Link className={classiPulsante.ghost} href="/prenotazioni-segreteria">
          No, tienilo
        </Link>
      </div>
    </>
  )
}
