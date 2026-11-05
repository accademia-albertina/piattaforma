'use client'

import { useFormFields } from '@payloadcms/ui'

import { IconaScuola } from '@/components/IconaScuola/IconaScuola'

/** Nella colonna laterale della scuola: l'icona ufficiale che compare sul sito (non modificabile). */
export default function IconaScuolaPannello() {
  const slug = useFormFields(([fields]) => fields.slug?.value)
  return (
    <div className="icona-scuola-pannello">
      <span className="field-label">Icona</span>
      {typeof slug === 'string' && slug ? (
        <IconaScuola scuola={slug} size={56} />
      ) : null}
      <p className="field-description">
        Icona ufficiale della scuola, sempre presente sul sito. Non si cambia dal pannello.
      </p>
    </div>
  )
}
