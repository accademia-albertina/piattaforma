'use client'

import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import {
  COLONNE,
  type DocenteSuggerito,
  oraDaSelettore,
  oraPerSelettore,
  righeDaIncolla,
  type Riga,
  type TipoCalendario,
} from '@/lib/calendari'

import { CampoDocenti, useDocenti } from './CampoDocenti'

/**
 * Editor a tabella dei calendari: una riga per fascia oraria (o per esame), come nel PDF.
 * Si può incollare un blocco di celle da Excel o Word: le righe vengono aggiunte da lì in giù.
 */
export function TabellaCalendario({
  path = 'righe',
  docenti: docentiIniziali,
}: {
  path?: string
  /** Solo per storie e test: altrimenti l'elenco arriva dall'API. */
  docenti?: DocenteSuggerito[]
}) {
  const { value, setValue } = useField<Riga[]>({ path })
  const docenti = useDocenti(docentiIniziali)
  const tipo = (useFormFields(([fields]) => fields.tipo?.value) as TipoCalendario) || 'lezioni'
  const colonne = COLONNE[tipo] ?? COLONNE.lezioni
  const righe = useMemo(() => (Array.isArray(value) ? value : []), [value])
  const vuota = useCallback(
    (): Riga => Object.fromEntries(colonne.map((c) => [c.chiave, ''])),
    [colonne],
  )

  // Senza righe si mostra una riga vuota da compilare.
  const elenco = righe.length > 0 ? righe : [vuota()]
  const aggiorna = (nuove: Riga[]) => setValue(nuove)
  const cambia = (r: number, chiave: string, v: string) =>
    aggiorna(elenco.map((riga, i) => (i === r ? { ...riga, [chiave]: v } : riga)))
  const inserisci = (dopo: number, nuove: Riga[]) =>
    aggiorna([...elenco.slice(0, dopo + 1), ...nuove, ...elenco.slice(dopo + 1)])
  const sposta = (r: number, di: number) => {
    const j = r + di
    if (j < 0 || j >= elenco.length) return
    const copia = [...elenco]
    ;[copia[r], copia[j]] = [copia[j], copia[r]]
    aggiorna(copia)
  }

  const incolla = (r: number, c: number) => (e: React.ClipboardEvent) => {
    const testo = e.clipboardData.getData('text/plain')
    if (!testo.includes('\t') && !testo.includes('\n')) return
    e.preventDefault()
    // Le celle incollate partono dalla colonna in cui si trova il cursore.
    const incollate = righeDaIncolla(testo, colonne.slice(c))
    const copia = [...elenco]
    incollate.forEach((nuova, k) => {
      const base = copia[r + k] ?? vuota()
      copia[r + k] = { ...base, ...nuova }
    })
    aggiorna(copia)
  }

  return (
    <div className="field-type tabella-calendario">
      <FieldLabel label="Tabella" path={path} />
      <p className="field-description tabella-calendario__aiuto">
        Una riga per ogni fascia oraria, come nel PDF: se un corso ha più giorni o orari, duplica la
        riga e cambia solo quello che serve. Puoi copiare celle da Excel o Word e incollarle in una
        cella qui: le righe si compilano da lì in giù. Nel sito le celle uguali una sotto l’altra si
        uniscono da sole. Nella colonna dei docenti inizia a scrivere il cognome e scegli
        dall’elenco (frecce e Invio); per gli orari usa il selettore dell’ora.
      </p>
      <div className="tabella-calendario__scorri">
        <table>
          <thead>
            <tr>
              <th scope="col" className="tabella-calendario__n">
                <span className="tabella-calendario__nascosto">Riga</span>
              </th>
              {colonne.map((c) => (
                <th key={c.chiave} scope="col" style={{ width: `${c.larghezza ?? 10}ch` }}>
                  {c.etichetta}
                </th>
              ))}
              <th scope="col" style={{ width: '9.5rem' }}>
                <span className="tabella-calendario__nascosto">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {elenco.map((riga, r) => (
              <tr key={r}>
                <td className="tabella-calendario__n">{r + 1}</td>
                {colonne.map((c, k) => {
                  const props = {
                    'aria-label': `${c.etichetta}, riga ${r + 1}`,
                    value: riga[c.chiave] ?? '',
                    placeholder: r === 0 ? c.esempio : undefined,
                    onPaste: incolla(r, k),
                  }
                  return (
                    <td key={c.chiave}>
                      {c.campo === 'ora' ? (
                        // Selettore dell'ora (24 ore, passi di 5 minuti): niente punti al posto dei due punti
                        <input
                          {...props}
                          type="time"
                          step={300}
                          value={oraPerSelettore(riga[c.chiave])}
                          title={
                            riga[c.chiave] && !oraPerSelettore(riga[c.chiave])
                              ? `Valore attuale: ${riga[c.chiave]}`
                              : undefined
                          }
                          onChange={(e) => cambia(r, c.chiave, oraDaSelettore(e.target.value))}
                        />
                      ) : c.campo === 'docenti-cognome' || c.campo === 'docenti-completo' ? (
                        <CampoDocenti
                          {...props}
                          value={riga[c.chiave] ?? ''}
                          formato={c.campo === 'docenti-completo' ? 'completo' : 'cognome'}
                          docenti={docenti}
                          onChange={(v) => cambia(r, c.chiave, v)}
                        />
                      ) : c.lunga ? (
                        <textarea
                          {...props}
                          rows={Math.max(1, (riga[c.chiave] ?? '').split('\n').length)}
                          onChange={(e) => cambia(r, c.chiave, e.target.value)}
                        />
                      ) : (
                        <input
                          {...props}
                          type="text"
                          onChange={(e) => cambia(r, c.chiave, e.target.value)}
                        />
                      )}
                    </td>
                  )
                })}
                <td className="tabella-calendario__azioni">
                  <button
                    type="button"
                    title="Duplica la riga"
                    aria-label={`Duplica la riga ${r + 1}`}
                    onClick={() => inserisci(r, [{ ...riga }])}
                  >
                    <Copy size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    title="Sposta su"
                    aria-label={`Sposta su la riga ${r + 1}`}
                    disabled={r === 0}
                    onClick={() => sposta(r, -1)}
                  >
                    <ArrowUp size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    title="Sposta giù"
                    aria-label={`Sposta giù la riga ${r + 1}`}
                    disabled={r === elenco.length - 1}
                    onClick={() => sposta(r, 1)}
                  >
                    <ArrowDown size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    title="Elimina la riga"
                    aria-label={`Elimina la riga ${r + 1}`}
                    onClick={() => aggiorna(elenco.filter((_, i) => i !== r))}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tabella-calendario__piede">
        <button
          type="button"
          className="btn btn--style-secondary btn--size-medium tabella-calendario__aggiungi"
          onClick={() => aggiorna([...elenco, vuota()])}
        >
          <Plus size={16} aria-hidden /> Aggiungi riga
        </button>
        <span className="tabella-calendario__conta">
          {righe.length} {righe.length === 1 ? 'riga' : 'righe'}
        </span>
      </div>
    </div>
  )
}
