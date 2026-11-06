import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CATEGORIA_LABELS, categorieConsentite } from '@/access/avvisi'
import { BACKEND_ROLES, ROLE_LABELS, canAccessBackend, isAdmin, type Role } from '@/access/roles'
import { guideDi } from '@/content/guide'

import styles from './Guida.module.css'

/**
 * Guida d'uso del pannello (/admin/guida): solo le guide delle sezioni del proprio ruolo.
 * L'admin le vede tutte e può vederle "come" un altro ruolo (?ruolo=docente).
 */
export default function Guida({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin
  if (!canAccessBackend(req.user)) redirect(`${admin}/login`)

  const richiesto = typeof searchParams?.ruolo === 'string' ? searchParams.ruolo : null
  const come =
    isAdmin(req.user) && richiesto && (BACKEND_ROLES as string[]).includes(richiesto)
      ? (richiesto as Role)
      : null
  const utente = come ? { roles: [come] } : req.user
  const guide = guideDi(utente)
  const categorie = categorieConsentite(utente).map((c) => CATEGORIA_LABELS[c])

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      viewActions={req.payload.config.admin?.components?.actions}
      visibleEntities={visibleEntities}
    >
      <Gutter className={styles.guida}>
        <header className={styles.intestazione}>
          <h1>Guida</h1>
          <p>
            {come
              ? `Le guide come le vede il ruolo ${ROLE_LABELS[come]}.`
              : 'Come si usa il pannello, solo per le sezioni del tuo ruolo.'}
          </p>
          {isAdmin(req.user) && (
            <nav aria-label="Vedi la guida come" className={styles.ruoli}>
              <span>Vedi come:</span>
              <Link href={`${admin}/guida`} aria-current={!come ? 'page' : undefined}>
                Tutte
              </Link>
              {BACKEND_ROLES.filter((r) => r !== 'admin').map((r) => (
                <Link
                  key={r}
                  href={`${admin}/guida?ruolo=${r}`}
                  aria-current={come === r ? 'page' : undefined}
                >
                  {ROLE_LABELS[r]}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <div className={styles.corpo}>
          <nav aria-label="Indice della guida" className={styles.indice}>
            <ol>
              {guide.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`}>{g.titolo}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.guide}>
            {guide.map((g) => (
              <section key={g.id} aria-labelledby={g.id} className={styles.voce}>
                <h2 id={g.id}>{g.titolo}</h2>
                <p className={styles.intro}>{g.intro}</p>
                <ol className={styles.passi}>
                  {g.passi.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
                {g.id === 'avvisi' && !isAdmin(utente) && categorie.length > 0 && (
                  <p className={styles.nota}>
                    <strong>Le tue categorie:</strong> {categorie.join(', ')}.
                  </p>
                )}
                {g.consigli?.map((c) => (
                  <p key={c} className={styles.nota}>
                    {c}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
