'use client'

import { useRowLabel } from '@payloadcms/ui'

import { GIORNI_SETTIMANA } from '@/lib/sportello-orari'

const data = (v: unknown) => {
  if (typeof v !== 'string' || !v) return ''
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  }).format(new Date(v))
}

/**
 * Etichetta delle righe nelle impostazioni dello sportello, così le righe chiuse si leggono:
 * “Lunedì, 10:00–12:00”, “28 dicembre 2026 · Chiusura”.
 */
export function EtichettaSportello({ tipo }: { tipo: 'orario' | 'apertura' | 'chiusura' }) {
  const { data: r, rowNumber } = useRowLabel<Record<string, string | null | undefined>>()
  const ore = r?.dalle && r?.alle ? `${r.dalle}–${r.alle}` : ''
  let testo = ''
  if (tipo === 'orario') {
    const giorno = GIORNI_SETTIMANA.find((g) => g.value === r?.giorno)?.label ?? ''
    testo = [giorno, ore].filter(Boolean).join(', ')
  } else if (tipo === 'apertura') {
    testo = [data(r?.data), ore].filter(Boolean).join(', ')
  } else {
    const periodo = r?.al && r.al !== r.dal ? `${data(r.dal)} – ${data(r.al)}` : data(r?.dal)
    testo = [periodo, ore ? `ore ${ore}` : 'tutto il giorno', r?.motivo].filter(Boolean).join(' · ')
  }
  return <span>{testo || `Riga ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>
}
