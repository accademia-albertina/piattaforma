'use client'

import { useConfig, useFormFields } from '@payloadcms/ui'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

/**
 * Nella voce del registro attività: collegamento all'elemento toccato, se esiste ancora.
 * Dopo un'eliminazione non c'è più nulla da aprire.
 */
export default function ApriElementoRegistro() {
  const { config } = useConfig()
  const azione = useFormFields(([f]) => f.azione?.initialValue)
  const collezione = useFormFields(([f]) => f.collezione?.initialValue)
  const id = useFormFields(([f]) => f.documentoId?.initialValue)
  if (azione === 'eliminato' || typeof collezione !== 'string' || !collezione) return null
  const admin = config.routes.admin
  const href =
    typeof id === 'string' && id
      ? `${admin}/collections/${collezione}/${id}`
      : `${admin}/globals/${collezione}`
  return (
    <div className="link-sul-sito">
      <Link href={href}>
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
        Apri l’elemento
      </Link>
    </div>
  )
}
