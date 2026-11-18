'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { OPERAZIONI } from '@/lib/registro/costanti'

/** Le operazioni di sincronizzazione e Drive si seguono tutte dalla pagina Integrazioni. */
const DA_PAGINA_DRIVE = new Set<string>(Object.values(OPERAZIONI).map((o) => o.slug))

/**
 * Nella voce del registro attività: collegamento all'elemento toccato, se esiste ancora.
 * Dopo un'eliminazione non c'è più nulla da aprire; per le operazioni si apre la pagina
 * da cui si avviano.
 */
export default function ApriElementoRegistro() {
  const { config } = useConfig()
  const azione = useFormFields(([f]) => f.azione?.initialValue)
  const collezione = useFormFields(([f]) => f.collezione?.initialValue)
  const id = useFormFields(([f]) => f.documentoId?.initialValue)
  if (azione === 'eliminato' || typeof collezione !== 'string' || !collezione) return null
  const admin = config.routes.admin
  const operazione = DA_PAGINA_DRIVE.has(collezione)
  const href = operazione
    ? `${admin}/integrazioni`
    : typeof id === 'string' && id
      ? `${admin}/collections/${collezione}/${id}`
      : `${admin}/globals/${collezione}`
  return (
    <div className="link-sul-sito">
      <Link href={href}>
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
        {operazione ? 'Apri la pagina Integrazioni' : 'Apri l’elemento'}
      </Link>
    </div>
  )
}
