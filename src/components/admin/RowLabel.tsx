'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Etichetta delle righe degli array nel pannello: mostra il valore di un campo della riga
 * (es. il titolo della voce) invece di “Voce 01”. Con `campo` del tipo `gruppi[].titolo`
 * unisce i valori di un array annidato.
 */
export function RowLabel({ campo, fallback }: { campo: string; fallback: string }) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const numero = String((rowNumber ?? 0) + 1).padStart(2, '0')
  const [array, sotto] = campo.split('[].')
  const valori = sotto
    ? ((data?.[array] as Record<string, unknown>[] | undefined) ?? []).map((r) => r?.[sotto])
    : [data?.[campo]]
  const testo = valori
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .join(' · ')
  return <span>{testo || `${fallback} ${numero}`}</span>
}
