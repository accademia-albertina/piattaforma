'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { Download } from 'lucide-react'

type Props = {
  /** Collezione delle iscrizioni e parametro del filtro, es. "iscrizioni-corsi" e "corso". */
  collezione?: 'iscrizioni-corsi' | 'iscrizioni-esami'
  riferimento?: 'corso' | 'appello'
  /** Nella finestra di iscrizione: tutte le iscrizioni del suo anno accademico e tipo. */
  perAnno?: boolean
}

/** Scarica l'elenco degli iscritti in CSV (si apre con Excel). */
export default function ScaricaIscritti({ collezione, riferimento, perAnno }: Props) {
  const { id } = useDocumentInfo()
  const anno = useFormFields(([f]) => f.annoAccademico?.initialValue)
  const tipo = useFormFields(([f]) => f.tipo?.initialValue)
  if (!id) return null

  let href: string
  let testo: string
  if (perAnno) {
    if (typeof anno !== 'string' || !anno) return null
    const coll = tipo === 'esami' ? 'iscrizioni-esami' : 'iscrizioni-corsi'
    href = `/api/${coll}/export?anno=${encodeURIComponent(anno)}`
    testo = `Scarica le iscrizioni del ${anno} (CSV)`
  } else {
    href = `/api/${collezione}/export?${riferimento}=${encodeURIComponent(String(id))}`
    testo = 'Scarica l’elenco (Excel, CSV)'
  }
  return (
    <div className="scarica-iscritti">
      <a href={href} download>
        <Download size={16} strokeWidth={1.5} aria-hidden />
        {testo}
      </a>
    </div>
  )
}
