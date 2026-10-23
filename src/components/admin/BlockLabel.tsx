'use client'

import { Pill, useRowLabel } from '@payloadcms/ui'

import { riassuntoBlocco } from './riassuntoBlocco'

/**
 * Intestazione dei blocchi delle pagine nel pannello: numero, tipo di blocco e un riassunto
 * del contenuto (titolo, didascalia o inizio del testo) al posto del campo “Senza titolo”.
 */
export function BlockLabel({ tipo }: { tipo: string }) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const numero = String((rowNumber ?? 0) + 1).padStart(2, '0')
  const riassunto = riassuntoBlocco(data)
  return (
    <span className="etichetta-blocco">
      <span className="etichetta-blocco__numero">{numero}</span>
      <Pill pillStyle="white" size="small">
        {tipo}
      </Pill>
      {riassunto && <span className="etichetta-blocco__riassunto">{riassunto}</span>}
    </span>
  )
}
