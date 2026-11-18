import type { Metadata } from 'next'
import Link from 'next/link'

import { Alert, Breadcrumbs, DisdettaSportello, TestataPagina } from '@/components'
import { payloadClient } from '@/lib/payload'
import { codiceDisdettaValido } from '@/lib/sportello'
import { etichettaAppuntamento } from '@/lib/sportello-orari'

import styles from '../prenotazioni.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Disdici l’appuntamento',
  robots: { index: false },
}

type Props = { searchParams: Promise<{ p?: string; token?: string }> }

/** Disdetta dal link dell'email: funziona anche senza accesso (esterni). */
export default async function Disdici({ searchParams }: Props) {
  const { p, token = '' } = await searchParams
  const payload = await payloadClient()
  const id = Number(p)
  const prenotazione = Number.isFinite(id)
    ? await payload
        .findByID({
          collection: 'prenotazioni-segreteria',
          id,
          depth: 0,
          overrideAccess: true,
          showHiddenFields: true,
        })
        .catch(() => null)
    : null
  const valida = prenotazione && codiceDisdettaValido(token, prenotazione.tokenDisdetta)
  const futura = valida && new Date(prenotazione.inizio).getTime() > Date.now()

  return (
    <div className={`container ${styles.pagina}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Prenota in segreteria', href: '/prenotazioni-segreteria' },
          { label: 'Disdici' },
        ]}
      />
      <TestataPagina occhiello="Segreteria didattica" titolo="Disdici l’appuntamento" />
      <div className={styles.disdetta}>
        {!valida ? (
          <Alert tone="warning" title="Link non valido">
            <p>
              Il link non corrisponde a un appuntamento. Se hai prenotato con l’account
              istituzionale puoi disdire da <Link href="/prenotazioni-segreteria">Prenota in segreteria</Link>.
            </p>
          </Alert>
        ) : prenotazione.stato !== 'prenotata' || !futura ? (
          <Alert tone="info" title="Niente da disdire">
            <p>Questo appuntamento è già stato annullato oppure è passato.</p>
          </Alert>
        ) : (
          <DisdettaSportello
            id={prenotazione.id}
            token={token}
            documento={prenotazione.documento}
            quando={etichettaAppuntamento(prenotazione.inizio)}
          />
        )}
      </div>
    </div>
  )
}
