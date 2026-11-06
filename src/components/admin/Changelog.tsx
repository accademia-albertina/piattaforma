import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'

import { vedeSezione } from '@/access/pannello'
import { canAccessBackend } from '@/access/roles'
import { CHANGELOG, ETICHETTE_TIPO, TIPI_VOCE } from '@/content/changelog'

import styles from './Changelog.module.css'

const formatoData = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Rome',
})

/** Registro delle versioni nel pannello (/admin/changelog): per chi gestisce il sito (non i docenti). */
export default function Changelog({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!canAccessBackend(req.user)) redirect(`${req.payload.config.routes.admin}/login`)
  // Il registro delle versioni serve a chi gestisce il sito, non ai docenti
  if (!vedeSezione(req.user, 'changelog')) redirect(req.payload.config.routes.admin)

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
      <Gutter className={styles.changelog}>
        <header className={styles.intestazione}>
          <h1>Changelog</h1>
          <p>
            Cosa cambia nella piattaforma, versione per versione. Versione attuale:{' '}
            <strong>{CHANGELOG[0].versione}</strong>.
          </p>
        </header>

        <ol className={styles.versioni}>
          {CHANGELOG.map((v) => (
            <li key={v.versione} className={styles.versione}>
              <div className={styles.testa}>
                <h2 id={`v${v.versione}`}>
                  <span className={styles.numero}>{v.versione}</span> {v.titolo}
                </h2>
                <time dateTime={v.data} className={styles.data}>
                  {formatoData.format(new Date(`${v.data}T12:00:00Z`))}
                </time>
              </div>
              {TIPI_VOCE.map((tipo) => {
                const voci = v.voci.filter((x) => x.tipo === tipo)
                if (voci.length === 0) return null
                return (
                  <section key={tipo} aria-label={ETICHETTE_TIPO[tipo]} className={styles.gruppo}>
                    <h3 className={styles.tipo} data-tipo={tipo}>
                      {ETICHETTE_TIPO[tipo]}
                    </h3>
                    <ul>
                      {voci.map((x) => (
                        <li key={x.testo}>{x.testo}</li>
                      ))}
                    </ul>
                  </section>
                )
              })}
              <p className={styles.pr}>PR {v.pr.map((n) => `#${n}`).join(', ')}</p>
            </li>
          ))}
        </ol>
      </Gutter>
    </DefaultTemplate>
  )
}
