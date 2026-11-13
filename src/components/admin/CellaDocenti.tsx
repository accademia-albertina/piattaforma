'use client'

import { useEffect, useId, useState } from 'react'

import { filtraDocenti, nomeInScrittura } from '@/lib/calendari'

/** Nomi dei docenti ("Cognome Nome"), letti una volta sola per tutte le celle. */
let richiesta: Promise<string[]> | null = null
function caricaDocenti(): Promise<string[]> {
  richiesta ??= fetch(
    '/api/docenti?pagination=false&depth=0&sort=cognome&where[attivo][equals]=true&select[cognome]=true&select[nome]=true',
    { credentials: 'include' },
  )
    .then((r) => (r.ok ? r.json() : { docs: [] }))
    .then((j: { docs?: { cognome?: string; nome?: string }[] }) =>
      (j.docs ?? []).map((d) => [d.cognome, d.nome].filter(Boolean).join(' ')).filter(Boolean),
    )
    .catch(() => {
      richiesta = null
      return []
    })
  return richiesta
}

type Props = {
  value: string
  onChange: (v: string) => void
  'aria-label': string
  placeholder?: string
  onPaste?: React.ClipboardEventHandler
  /** Più righe (textarea) o una sola (input). */
  lunga?: boolean
}

/**
 * Cella "Docenti" dell'editor dei calendari: mentre si scrive propone i docenti del sito,
 * così il nome è scritto sempre uguale. Si può comunque scrivere a mano (note, più docenti
 * separati da virgola o a capo): il suggerimento completa solo il nome che si sta scrivendo.
 */
export function CellaDocenti({ value, onChange, lunga, ...resto }: Props) {
  const [nomi, setNomi] = useState<string[]>([])
  const [aperto, setAperto] = useState(false)
  const [attivo, setAttivo] = useState(0)
  const id = useId()

  useEffect(() => {
    let vivo = true
    caricaDocenti().then((n) => vivo && setNomi(n))
    return () => {
      vivo = false
    }
  }, [])

  const { prima, parziale } = nomeInScrittura(value)
  const proposte = aperto ? filtraDocenti(parziale, nomi).filter((n) => n !== parziale) : []
  const mostra = proposte.length > 0

  const scegli = (nome: string) => {
    onChange(prima + nome)
    setAperto(false)
  }

  const tasti = (e: React.KeyboardEvent) => {
    if (!mostra) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const di = e.key === 'ArrowDown' ? 1 : -1
      setAttivo((a) => (a + di + proposte.length) % proposte.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter') e.preventDefault()
      scegli(proposte[Math.min(attivo, proposte.length - 1)])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAperto(false)
    }
  }

  const props = {
    ...resto,
    value,
    role: 'combobox',
    'aria-autocomplete': 'list' as const,
    'aria-expanded': mostra,
    'aria-controls': `${id}-lista`,
    'aria-activedescendant': mostra ? `${id}-${Math.min(attivo, proposte.length - 1)}` : undefined,
    autoComplete: 'off',
    onKeyDown: tasti,
    onBlur: () => setAperto(false),
    onFocus: () => setAttivo(0),
  }

  return (
    <div className="cella-docenti">
      {lunga ? (
        <textarea
          {...props}
          rows={Math.max(1, value.split('\n').length)}
          onChange={(e) => {
            onChange(e.target.value)
            setAperto(true)
            setAttivo(0)
          }}
        />
      ) : (
        <input
          {...props}
          type="text"
          onChange={(e) => {
            onChange(e.target.value)
            setAperto(true)
            setAttivo(0)
          }}
        />
      )}
      <ul id={`${id}-lista`} role="listbox" aria-label="Docenti" className="cella-docenti__lista" hidden={!mostra}>
        {proposte.map((n, i) => (
          <li
            key={n}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === attivo}
            // mousedown, non click: il click arriverebbe dopo il blur che chiude la lista
            onMouseDown={(e) => {
              e.preventDefault()
              scegli(n)
            }}
          >
            {n}
          </li>
        ))}
      </ul>
    </div>
  )
}
