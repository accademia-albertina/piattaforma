import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'

import { datiStudente } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import { urlAccesso } from '@/auth/google'
import { Alert, Breadcrumbs, PrenotazioneSportello, TestataPagina } from '@/components'
import { payloadClient } from '@/lib/payload'
import { disponibilita, leggiImpostazioni } from '@/lib/sportello'

import styles from './prenotazioni.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Prenota in segreteria',
  description:
    'Prenota un appuntamento in segreteria didattica per ritirare libretto, pergamena, certificati e altri documenti.',
}

/** Prenotazione dei turni allo sportello della segreteria didattica (al posto di Amelia). */
export default async function PrenotazioniSegreteria() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const imp = await leggiImpostazioni(payload)
  const giorni = imp.attivo ? await disponibilita(payload, imp) : []

  const studente = user && hasRole(user, 'studente') ? datiStudente(user.email) : null
  const nominativo = user ? [user.nome, user.cognome].filter(Boolean).join(' ') || user.email : ''

  const { docs: miei } = user
    ? await payload.find({
        collection: 'prenotazioni-segreteria',
        where: {
          utente: { equals: user.id },
          stato: { equals: 'prenotata' },
          inizio: { greater_than: new Date().toISOString() },
        },
        sort: 'inizio',
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] }

  return (
    <div className={`container ${styles.pagina}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Segreteria didattica', href: '/studente/segreteria-didattica' },
          { label: 'Prenota in segreteria' },
        ]}
      />
      <TestataPagina
        occhiello="Segreteria didattica"
        titolo="Prenota in segreteria"
        sommario="Per ritirare libretto, pergamena, certificati e gli altri documenti serve un appuntamento. Scegli il documento, il giorno e l’orario: ricevi la conferma via email."
      />
      {imp.avviso && (
        <div className={styles.avviso}>
          <Alert tone="info" title="Da sapere">
            <p>{imp.avviso}</p>
          </Alert>
        </div>
      )}
      <PrenotazioneSportello
        utente={
          user
            ? {
                tipo: 'account',
                nominativo,
                dettaglio: studente ? `matricola ${studente.matricola}` : user.email,
              }
            : { tipo: 'anonimo' }
        }
        accessoHref={urlAccesso('/prenotazioni-segreteria')}
        attivo={imp.attivo}
        documenti={imp.documenti
          .filter((d) => d.attivo)
          .map(({ id, nome, descrizione }) => ({ id, nome, descrizione }))}
        giorni={giorni}
        appuntamenti={miei.map((p) => ({ id: p.id, documento: p.documento, inizio: p.inizio }))}
      />
      <p className={styles.piede}>
        Per richieste diverse dal ritiro di documenti scrivi alla{' '}
        <Link href="/studente/segreteria-didattica">segreteria didattica</Link>.
      </p>
    </div>
  )
}
