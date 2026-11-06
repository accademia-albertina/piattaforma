import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'

import { payloadClient } from '@/lib/payload'

import styles from './attesa.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account in attesa di abilitazione',
  robots: { index: false },
}

/**
 * Dove arriva il personale al primo accesso con Google: l'account esiste ma il ruolo
 * lo assegna un amministratore (studenti e docenti in elenco sono abilitati da soli).
 */
export default async function AccessoInAttesa() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const abilitato = Boolean((user as { roles?: string[] } | null)?.roles?.length)

  return (
    <div className={`container ${styles.pagina}`}>
      <p className="eyebrow">Area riservata</p>
      {abilitato ? (
        <>
          <h1 className={styles.titolo}>Il tuo account è abilitato</h1>
          <p className={styles.intro}>Puoi entrare nel pannello con il tuo ruolo.</p>
          <Link href="/admin" className="btn btn-primario">
            Vai al pannello
          </Link>
        </>
      ) : (
        <>
          <h1 className={styles.titolo}>Account in attesa di abilitazione</h1>
          <p className={styles.intro}>
            {user ? (
              <>
                Hai effettuato l’accesso come <strong>{user.email}</strong>.{' '}
              </>
            ) : null}
            Il tuo account è stato creato. Un amministratore deve ora assegnarti il ruolo (per
            esempio Segreteria o Biblioteca): quando l’avrà fatto, ti basterà accedere di nuovo.
          </p>
          <div className={styles.azioni}>
            <Link href="/" className="btn btn-primario">
              Torna al sito
            </Link>
            {user && (
              <Link href="/admin/logout" className="btn btn-secondario">
                Esci
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
