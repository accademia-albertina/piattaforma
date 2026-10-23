import type { AdminViewServerProps, CollectionSlug, GlobalSlug, PayloadRequest } from 'payload'

import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'

import { ROLE_LABELS, type Role } from '@/access/roles'

import styles from './Dashboard.module.css'

type Sezione = {
  slug: string
  tipo: 'collezione' | 'globale'
  /** Permesso che serve per vedere la scheda (il menu e gli utenti si leggono anche senza gestirli). */
  serve: 'read' | 'update' | 'create'
  nuovo?: string
}

/** Sezioni del pannello nell'ordine in cui le vedono i redattori; titoli e descrizioni dalla config. */
const SEZIONI: Sezione[] = [
  { slug: 'avvisi', tipo: 'collezione', serve: 'read', nuovo: 'Nuovo avviso' },
  { slug: 'pagine', tipo: 'collezione', serve: 'read', nuovo: 'Nuova pagina' },
  { slug: 'media', tipo: 'collezione', serve: 'read', nuovo: 'Carica un file' },
  { slug: 'scuole', tipo: 'collezione', serve: 'read' },
  { slug: 'navigazione', tipo: 'globale', serve: 'update' },
  { slug: 'users', tipo: 'collezione', serve: 'create' },
]

/** Collezioni con bozze che compaiono in “Ultime modifiche”. */
const CON_BOZZE = [
  { slug: 'avvisi', tipo: 'Avviso' },
  { slug: 'pagine', tipo: 'Pagina' },
] as const

const data = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Rome',
})

/**
 * Pagina iniziale del pannello: saluto, azioni rapide, sezioni con descrizione e conteggi,
 * ultime modifiche. Mostra solo ciò che il ruolo dell'utente può leggere o creare.
 */
export default async function Dashboard({
  initPageResult,
  payload,
  permissions,
  user,
}: AdminViewServerProps) {
  const req = initPageResult.req as PayloadRequest
  const admin = payload.config.routes.admin
  const permessiCollezioni = permissions?.collections ?? {}
  const permessiGlobali = permissions?.globals ?? {}

  const visibili = SEZIONI.filter((s) =>
    s.tipo === 'collezione'
      ? permessiCollezioni[s.slug]?.[s.serve]
      : s.serve !== 'create' && permessiGlobali[s.slug]?.[s.serve],
  ).map((s) => {
    const config =
      s.tipo === 'collezione'
        ? payload.collections[s.slug as CollectionSlug]?.config
        : payload.config.globals.find((g) => g.slug === s.slug)
    const titolo =
      s.tipo === 'collezione'
        ? (config as { labels?: { plural?: unknown } })?.labels?.plural
        : (config as { label?: unknown })?.label
    const descrizione = config?.admin?.description
    return {
      ...s,
      titolo: typeof titolo === 'string' ? titolo : s.slug,
      descrizione: typeof descrizione === 'string' ? descrizione : '',
    }
  })

  const conteggi = await Promise.all(
    visibili.map(async (s) => {
      if (s.tipo !== 'collezione') return { totale: null, bozze: null }
      const collection = s.slug as CollectionSlug
      const { totalDocs: totale } = await payload.count({ collection, req, overrideAccess: false })
      const conBozze = CON_BOZZE.some((c) => c.slug === s.slug)
      const bozze = conBozze
        ? (
            await payload.count({
              collection,
              req,
              overrideAccess: false,
              where: { _status: { equals: 'draft' } },
            })
          ).totalDocs
        : null
      return { totale, bozze }
    }),
  )

  const recenti = (
    await Promise.all(
      CON_BOZZE.filter((c) => permessiCollezioni[c.slug]?.read).map(async ({ slug, tipo }) => {
        const { docs } = await payload.find({
          collection: slug,
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
          limit: 8,
          sort: '-updatedAt',
          select: { titolo: true, updatedAt: true, _status: true },
        })
        return docs.map((doc) => ({ ...doc, slug, tipo }))
      }),
    )
  )
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)

  const nome = (user as { nome?: string } | null)?.nome || user?.email
  const ruoli = ((user as { roles?: Role[] } | null)?.roles ?? []).map((r) => ROLE_LABELS[r])
  const azioni = visibili.filter((s) => s.nuovo && permessiCollezioni[s.slug]?.create)
  const urlSezione = (s: Sezione) =>
    s.tipo === 'collezione'
      ? `${admin}/collections/${s.slug}`
      : `${admin}/globals/${s.slug as GlobalSlug}`

  return (
    <Gutter className={styles.dashboard}>
      <div className={styles.intestazione}>
        <div>
          <h1 className={styles.saluto}>Ciao{nome ? `, ${nome}` : ''}</h1>
          {ruoli.length > 0 && <p className={styles.ruoli}>{ruoli.join(' · ')}</p>}
        </div>
        <a className={styles.sito} href="/" target="_blank" rel="noopener">
          Apri il sito <span aria-hidden="true">↗</span>
          <span className={styles.nascosto}> (si apre in una nuova scheda)</span>
        </a>
      </div>

      {azioni.length > 0 && (
        <section aria-labelledby="azioni-rapide" className={styles.sezione}>
          <h2 id="azioni-rapide" className={styles.titoloSezione}>
            Azioni rapide
          </h2>
          <ul className={styles.azioni}>
            {azioni.map((s) => (
              <li key={s.slug}>
                <Link className={styles.azione} href={`${urlSezione(s)}/create`}>
                  <span aria-hidden="true">+</span> {s.nuovo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sezioni" className={styles.sezione}>
        <h2 id="sezioni" className={styles.titoloSezione}>
          Contenuti e impostazioni
        </h2>
        <ul className={styles.griglia}>
          {visibili.map((s, i) => {
            const { totale, bozze } = conteggi[i]
            return (
              <li key={s.slug} className={styles.scheda}>
                <h3 className={styles.titoloScheda}>
                  <Link href={urlSezione(s)}>{s.titolo}</Link>
                </h3>
                {s.descrizione && <p className={styles.descrizione}>{s.descrizione}</p>}
                {totale !== null && (
                  <p className={styles.conteggio}>
                    <strong>{totale}</strong> {totale === 1 ? 'elemento' : 'elementi'}
                    {bozze ? ` · ${bozze} ${bozze === 1 ? 'bozza' : 'bozze'}` : ''}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {recenti.length > 0 && (
        <section aria-labelledby="ultime-modifiche" className={styles.sezione}>
          <h2 id="ultime-modifiche" className={styles.titoloSezione}>
            Ultime modifiche
          </h2>
          <table className={styles.tabella}>
            <thead>
              <tr>
                <th scope="col">Titolo</th>
                <th scope="col">Tipo</th>
                <th scope="col">Stato</th>
                <th scope="col">Modificato</th>
              </tr>
            </thead>
            <tbody>
              {recenti.map((doc) => (
                <tr key={`${doc.slug}-${doc.id}`}>
                  <td>
                    <Link href={`${admin}/collections/${doc.slug}/${doc.id}`}>
                      {doc.titolo || 'Senza titolo'}
                    </Link>
                  </td>
                  <td>{doc.tipo}</td>
                  <td>
                    <span
                      className={doc._status === 'published' ? styles.pubblicato : styles.bozza}
                    >
                      {doc._status === 'published' ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </td>
                  <td>
                    <time dateTime={doc.updatedAt}>{data.format(new Date(doc.updatedAt))}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </Gutter>
  )
}
