'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import {
  type DocenteSuggerito,
  filtraDocenti,
  nomeInScrittura,
  sostituisciNome,
} from '@/lib/calendari'

// Elenco dei docenti caricato una volta sola per pagina, condiviso da tutte le celle.
let richiesta: Promise<DocenteSuggerito[]> | null = null
function caricaDocenti(): Promise<DocenteSuggerito[]> {
  richiesta ??= fetch(
    '/api/docenti?limit=0&depth=0&sort=cognome&where[attivo][equals]=true&select[nome]=true&select[cognome]=true',
    { credentials: 'include' },
  )
    .then((r) => (r.ok ? r.json() : { docs: [] }))
    .then((j: { docs?: DocenteSuggerito[] }) => j.docs ?? [])
    .catch(() => {
      richiesta = null
      return []
    })
  return richiesta
}

export function useDocenti(docentiIniziali?: DocenteSuggerito[]) {
  const [docenti, setDocenti] = useState<DocenteSuggerito[]>(docentiIniziali ?? [])
  useEffect(() => {
    if (docentiIniziali) return
    let attivo = true
    caricaDocenti().then((d) => attivo && setDocenti(d))
    return () => {
      attivo = false
    }
  }, [docentiIniziali])
  return docenti
}

type Props = {
  value: string
  onChange: (v: string) => void
  'aria-label': string
  placeholder?: string
  onPaste?: (e: React.ClipboardEvent) => void
  /** «cognome» come negli orari (con il nome solo se il cognome è doppio), «completo» = Cognome Nome. */
  formato: 'cognome' | 'completo'
  docenti: DocenteSuggerito[]
}

/**
 * Cella “Docenti” della tabella dei calendari: mentre si scrive propone i docenti in servizio,
 * così il nome non si sbaglia. Più docenti nella stessa cella: si separano con virgola o a capo.
 *
 * Combobox ARIA 1.2 fatto a mano: il ComboBox di React Aria accetta solo un <input>, ma qui la
 * cella deve restare un <textarea> (alcune celle hanno note su più righe).
 */
export function CampoDocenti({
  value,
  onChange,
  formato,
  docenti,
  placeholder,
  onPaste,
  ...rest
}: Props) {
  const id = useId()
  const [aperto, setAperto] = useState(false)
  const [attivo, setAttivo] = useState(0)
  const suggeriti = aperto ? filtraDocenti(docenti, nomeInScrittura(value)) : []
  const visibile = suggeriti.length > 0

  // La lista è "fixed" sotto la cella: la tabella scorre in orizzontale e la taglierebbe.
  const campo = useRef<HTMLTextAreaElement>(null)
  const [posizione, setPosizione] = useState<{ top: number; left: number; width: number }>()
  useLayoutEffect(() => {
    if (!visibile || !campo.current) return
    const misura = () => {
      const r = campo.current?.getBoundingClientRect()
      if (r) setPosizione({ top: r.bottom, left: r.left, width: r.width })
    }
    misura()
    window.addEventListener('scroll', misura, true)
    window.addEventListener('resize', misura)
    return () => {
      window.removeEventListener('scroll', misura, true)
      window.removeEventListener('resize', misura)
    }
  }, [visibile, value])

  const etichetta = (d: DocenteSuggerito) => {
    if (formato === 'completo') return `${d.cognome} ${d.nome}`
    const omonimi = docenti.filter((x) => x.cognome === d.cognome).length > 1
    return omonimi ? `${d.cognome} ${d.nome}` : d.cognome
  }

  const scegli = (d: DocenteSuggerito) => {
    onChange(sostituisciNome(value, etichetta(d)))
    setAperto(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!visibile) {
      if (e.key === 'ArrowDown' && e.altKey) setAperto(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAttivo((a) => (a + 1) % suggeriti.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAttivo((a) => (a - 1 + suggeriti.length) % suggeriti.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      // Invio sceglie; Tab sceglie solo se c'è un suggerimento evidenziato, poi passa oltre
      if (e.key === 'Enter') e.preventDefault()
      scegli(suggeriti[Math.min(attivo, suggeriti.length - 1)])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAperto(false)
    }
  }

  return (
    <div className="campo-docenti">
      <textarea
        {...rest}
        ref={campo}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibile}
        aria-controls={visibile ? `${id}-lista` : undefined}
        aria-activedescendant={
          visibile ? `${id}-${Math.min(attivo, suggeriti.length - 1)}` : undefined
        }
        value={value}
        placeholder={placeholder}
        rows={Math.max(1, value.split('\n').length)}
        onPaste={onPaste}
        onChange={(e) => {
          onChange(e.target.value)
          setAperto(true)
          setAttivo(0)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setAperto(false)}
      />
      {visibile ? (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label="Docenti suggeriti"
          className="campo-docenti__lista"
          style={
            posizione
              ? { top: posizione.top, left: posizione.left, minWidth: posizione.width }
              : undefined
          }
        >
          {suggeriti.map((d, i) => (
            <li
              key={d.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === attivo}
              // mousedown: sceglie prima che il blur del textarea chiuda la lista
              onMouseDown={(e) => {
                e.preventDefault()
                scegli(d)
              }}
              onMouseEnter={() => setAttivo(i)}
            >
              <span className="campo-docenti__cognome">{d.cognome}</span> {d.nome}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
