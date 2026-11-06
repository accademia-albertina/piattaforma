'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { annoConcluso } from '@/access/corsi'

type Stato =
  | { tipo: 'riposo' }
  | { tipo: 'conferma' }
  | { tipo: 'invio' }
  | { tipo: 'fatto'; testo: string }
  | { tipo: 'errore'; testo: string }

/**
 * Nella finestra di un anno accademico concluso: elimina tutte le iscrizioni di quell'anno
 * (ai corsi o agli esami, come la finestra), dopo averle scaricate. Doppia conferma.
 */
export default function PuliziaIscrizioni() {
  const { id } = useDocumentInfo()
  const anno = useFormFields(([f]) => f.annoAccademico?.initialValue)
  const tipo = useFormFields(([f]) => f.tipo?.initialValue)
  const [stato, setStato] = useState<Stato>({ tipo: 'riposo' })
  if (!id || typeof anno !== 'string' || !annoConcluso(anno)) return null
  const cosa = tipo === 'esami' ? 'agli esami' : 'ai corsi'

  const elimina = async () => {
    setStato({ tipo: 'invio' })
    try {
      const res = await fetch(`/api/finestre-iscrizione/${id}/pulizia`, {
        method: 'POST',
        credentials: 'include',
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.message ?? 'Eliminazione non riuscita.')
      setStato({
        tipo: 'fatto',
        testo:
          dati.eliminate === 1
            ? `Eliminata 1 iscrizione ${cosa} del ${anno}.`
            : `Eliminate ${dati.eliminate} iscrizioni ${cosa} del ${anno}.`,
      })
    } catch (err) {
      setStato({ tipo: 'errore', testo: (err as Error).message })
    }
  }

  return (
    <div className="pulizia-iscrizioni">
      {stato.tipo === 'riposo' && (
        <button type="button" onClick={() => setStato({ tipo: 'conferma' })}>
          <Trash2 size={16} strokeWidth={1.5} aria-hidden />
          Elimina le iscrizioni del {anno}
        </button>
      )}
      {(stato.tipo === 'conferma' || stato.tipo === 'invio') && (
        <div role="group" aria-labelledby="pulizia-domanda">
          <p id="pulizia-domanda">
            Elimini tutte le iscrizioni {cosa} del {anno}? Non si recuperano: prima scarica il file
            qui sopra. Agli studenti non arriva nessuna email.
          </p>
          <div className="pulizia-iscrizioni__azioni">
            <button type="button" onClick={elimina} disabled={stato.tipo === 'invio'}>
              {stato.tipo === 'invio' ? 'Elimino…' : 'Sì, elimina'}
            </button>
            <button
              type="button"
              onClick={() => setStato({ tipo: 'riposo' })}
              disabled={stato.tipo === 'invio'}
            >
              No, tienile
            </button>
          </div>
        </div>
      )}
      <p className="pulizia-iscrizioni__esito" role="status">
        {stato.tipo === 'fatto' || stato.tipo === 'errore' ? stato.testo : ''}
      </p>
    </div>
  )
}
