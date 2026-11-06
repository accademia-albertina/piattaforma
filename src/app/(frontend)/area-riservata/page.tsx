import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { canAccessBackend, hasRole } from '@/access/roles'
import { PAGINA_ATTESA, PAGINA_STUDENTE } from '@/auth/endpoints'
import { urlAccesso } from '@/auth/google'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * “Accedi” dell'header: porta ognuno dove gli serve. Personale al pannello,
 * studenti alle proprie iscrizioni, chi non ha ancora un ruolo alla pagina di attesa.
 */
export default async function AreaRiservata() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(urlAccesso('/area-riservata'))
  if (canAccessBackend(user)) redirect('/admin')
  if (hasRole(user, 'studente')) redirect(PAGINA_STUDENTE)
  redirect(PAGINA_ATTESA)
}
