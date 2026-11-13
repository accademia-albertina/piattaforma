import type {
  AdminViewServerProps,
  CollectionSlug,
  GlobalSlug,
  PayloadRequest,
  Where,
} from 'payload'

import { Gutter } from '@payloadcms/ui'
import { BookOpen, Plus, UserRound } from 'lucide-react'
import Link from 'next/link'

import {
  filtroPannello,
  vedeSezione,
  vedeTutteLeModifiche,
  type SezionePannello,
} from '@/access/pannello'
import { ROLE_LABELS, hasRole, isAdmin, type Role } from '@/access/roles'
import { CHANGELOG } from '@/content/changelog'

import { ICONE_SEZIONI } from './icone'

import styles from './Dashboard.module.css'

type Sezione = {
  slug: SezionePannello
  tipo: 'collezione' | 'globale'
  /** Permesso che serve per vedere la scheda (il menu e gli utenti si leggono anche senza gestirli). */
  serve: 'read' | 'update' | 'create'
  nuovo?: string
}

/** Sezioni del pannello nell'ordine in cui le vedono i redattori; titoli e descrizioni dalla config. */
const SEZIONI: Sezione[] = [
  // Ognuno vede le sezioni in cui può modificare qualcosa, non tutte quelle che può leggere
  { slug: 'avvisi', tipo: 'collezione', serve: 'update', nuovo: 'Nuovo avviso' },
  { slug: 'pagine', tipo: 'collezione', serve: 'update', nuovo: 'Nuova pagina' },
  { slug: 'pubblicazioni', tipo: 'collezione', serve: 'update', nuovo: 'Nuovo volume' },
  { slug: 'corsi', tipo: 'collezione', serve: 'update' },
  { slug: 'docenti', tipo: 'collezione', serve: 'update' },
  { slug: 'media', tipo: 'collezione', serve: 'read', nuovo: 'Carica un file' },
  { slug: 'dottorandi', tipo: 'collezione', serve: 'update' },
  { slug: 'calendari', tipo: 'collezione', serve: 'update' },
  {
    slug: 'finestre-iscrizione',
    tipo: 'collezione',
    serve: 'update',
    nuovo: 'Nuova finestra di iscrizione',
  },
  { slug: 'iscrizioni-corsi', tipo: 'collezione', serve: 'read' },
  { slug: 'appelli', tipo: 'collezione', serve: 'create', nuovo: 'Nuovo appello' },
  { slug: 'iscrizioni-esami', tipo: 'collezione', serve: 'read' },
  { slug: 'scuole', tipo: 'collezione', serve: 'update' },
  { slug: 'albo', tipo: 'collezione', serve: 'update', nuovo: 'Nuovo atto all’Albo' },
  { slug: 'trasparenza', tipo: 'collezione', serve: 'update' },
  { slug: 'navigazione', tipo: 'globale', serve: 'update' },
  { slug: 'users', tipo: 'collezione', serve: 'create' },
  { slug: 'email-inviate', tipo: 'collezione', serve: 'read' },
]

/** Collezioni con bozze che compaiono in “Ultime modifiche”. */
const CON_BOZZE = [
  { slug: 'avvisi', tipo: 'Avviso' },
  { slug: 'pagine', tipo: 'Pagina' },
  { slug: 'corsi', tipo: 'Corso' },
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

  // Si vede solo ciò che si può modificare (tabella in src/access/pannello.ts)
  const visibili = SEZIONI.filter((s) =>
    !vedeSezione(user, s.slug)
      ? false
      : s.tipo === 'collezione'
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
    const gruppo = config?.admin?.group
    return {
      ...s,
      gruppo: typeof gruppo === 'string' ? gruppo : 'Impostazioni',
      titolo: typeof titolo === 'string' ? titolo : s.slug,
      descrizione: typeof descrizione === 'string' ? descrizione : '',
    }
  })

  const conteggi = await Promise.all(
    visibili.map(async (s) => {
      if (s.tipo !== 'collezione') return { totale: null, bozze: null }
      const collection = s.slug as CollectionSlug
      // Docente e uffici contano solo i propri elementi o le pagine affidate
      const filtro = filtroPannello(user, s.slug)
      const { totalDocs: totale } = await payload.count({
        collection,
        req,
        overrideAccess: false,
        ...(filtro ? { where: filtro } : {}),
      })
      const conBozze = CON_BOZZE.some((c) => c.slug === s.slug)
      const bozze = conBozze
        ? (
            await payload.count({
              collection,
              req,
              overrideAccess: false,
              where: filtro
                ? { and: [filtro, { _status: { equals: 'draft' } }] }
                : { _status: { equals: 'draft' } },
            })
          ).totalDocs
        : null
      return { totale, bozze }
    }),
  )

  const recenti = (
    await Promise.all(
      CON_BOZZE.filter((c) => vedeSezione(user, c.slug)).map(async ({ slug, tipo }) => {
        // Admin, vicedirezione e redazione vedono tutte le modifiche; gli altri solo le proprie
        const proprie: Record<(typeof CON_BOZZE)[number]['slug'], Where> = {
          avvisi: { autore: { equals: user?.id } },
          pagine: filtroPannello(user, 'pagine') ?? {},
          corsi: filtroPannello(user, 'corsi') ?? {},
        }
        const { docs } = await payload.find({
          ...(vedeTutteLeModifiche(user) ? {} : { where: proprie[slug] }),
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

  // Personale entrato con Google ma senza ruolo: lo abilita un amministratore
  const daAbilitare = isAdmin(user)
    ? await payload.find({
        collection: 'users',
        req,
        overrideAccess: false,
        where: { roles: { exists: false } },
        depth: 0,
        limit: 10,
        sort: '-createdAt',
        select: { email: true, nome: true, cognome: true, createdAt: true },
      })
    : null

  const nome = (user as { nome?: string } | null)?.nome || user?.email
  const ruoli = ((user as { roles?: Role[] } | null)?.roles ?? []).map((r) => ROLE_LABELS[r])

  // Il docente arriva subito al suo profilo e ai suoi corsi
  const docente = hasRole(user, 'docente') && !vedeTutteLeModifiche(user)
  const profilo = docente
    ? (
        await payload.find({
          collection: 'docenti',
          where: { account: { equals: user?.id } },
          depth: 0,
          limit: 1,
          select: { nomeCompleto: true },
          overrideAccess: true,
        })
      ).docs[0]
    : null
  // Al massimo tre azioni rapide (le più frequenti per il ruolo): le altre sono nelle schede
  const creabili = visibili.filter((s) => s.nuovo && permessiCollezioni[s.slug]?.create)
  const azioni = creabili.slice(0, docente ? 1 : 3)
  // Schede divise come il menu laterale (Contenuti, Didattica, Iscrizioni ed esami, Uffici…)
  const gruppi = visibili.reduce<
    { nome: string; sezioni: { s: (typeof visibili)[number]; i: number }[] }[]
  >((acc, s, i) => {
    const g =
      acc.find((x) => x.nome === s.gruppo) ?? acc[acc.push({ nome: s.gruppo, sezioni: [] }) - 1]
    g.sezioni.push({ s, i })
    return acc
  }, [])
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
        <div className={styles.collegamenti}>
          <Link className={styles.sito} href={`${admin}/guida`}>
            Guida
          </Link>
          {isAdmin(user) && (
            <Link className={styles.sito} href={`${admin}/drive`}>
              Google Drive
            </Link>
          )}
          {vedeSezione(user, 'changelog') && (
            <Link className={styles.sito} href={`${admin}/changelog`}>
              Changelog <span className={styles.versione}>v{CHANGELOG[0].versione}</span>
            </Link>
          )}
        </div>
      </div>

      {daAbilitare && daAbilitare.totalDocs > 0 && (
        <section aria-labelledby="da-abilitare" className={`${styles.sezione} ${styles.attesa}`}>
          <h2 id="da-abilitare" className={styles.titoloSezione}>
            Da abilitare ({daAbilitare.totalDocs})
          </h2>
          <p className={styles.descrizione}>
            Hanno fatto l’accesso con Google ma non hanno ancora un ruolo. Apri l’account e scegli
            il ruolo.
          </p>
          <ul className={styles.elencoAttesa}>
            {daAbilitare.docs.map((u) => (
              <li key={u.id}>
                <Link href={`${admin}/collections/users/${u.id}`}>
                  {[u.nome, u.cognome].filter(Boolean).join(' ') || u.email}
                </Link>{' '}
                <span className={styles.data}>
                  {u.nome || u.cognome ? `${u.email} · ` : ''}
                  {data.format(new Date(u.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(azioni.length > 0 || docente) && (
        <section aria-labelledby="azioni-rapide" className={styles.sezione}>
          <h2 id="azioni-rapide" className={styles.titoloSezione}>
            Azioni rapide
          </h2>
          <ul className={styles.azioni}>
            {profilo && (
              <li>
                <Link className={styles.azione} href={`${admin}/collections/docenti/${profilo.id}`}>
                  <UserRound size={18} strokeWidth={1.75} aria-hidden /> Il mio profilo
                </Link>
              </li>
            )}
            {docente && (
              <li>
                <Link className={styles.azione} href={`${admin}/collections/corsi`}>
                  <BookOpen size={18} strokeWidth={1.75} aria-hidden /> I miei corsi
                </Link>
              </li>
            )}
            {azioni.map((s) => (
              <li key={s.slug}>
                <Link className={styles.azione} href={`${urlSezione(s)}/create`}>
                  <Plus size={18} strokeWidth={1.75} aria-hidden /> {s.nuovo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gruppi.map(({ nome, sezioni }) => {
        const idTitolo = `gruppo-${nome.toLowerCase().replace(/[^a-z]+/g, '-')}`
        return (
          <section key={nome} aria-labelledby={idTitolo} className={styles.sezione}>
            <h2 id={idTitolo} className={styles.titoloSezione}>
              {nome}
            </h2>
            <ul className={styles.griglia}>
              {sezioni.map(({ s, i }) => {
                const { totale, bozze } = conteggi[i]
                const Icona = ICONE_SEZIONI[s.slug]
                const crea = s.nuovo && permessiCollezioni[s.slug]?.create
                return (
                  <li key={s.slug} className={styles.scheda}>
                    {Icona && (
                      <Icona className={styles.icona} size={24} strokeWidth={1.5} aria-hidden />
                    )}
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
                    <p className={styles.inviti}>
                      {/* Solo visivo: tutta la scheda porta già alla sezione */}
                      <span className={styles.apri} aria-hidden>
                        Apri →
                      </span>
                      {crea && (
                        <Link href={`${urlSezione(s)}/create`} className={styles.nuovo}>
                          <Plus size={16} strokeWidth={1.75} aria-hidden /> {s.nuovo}
                        </Link>
                      )}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {recenti.length > 0 && (
        <section aria-labelledby="ultime-modifiche" className={styles.sezione}>
          <h2 id="ultime-modifiche" className={styles.titoloSezione}>
            Ultime modifiche
          </h2>
          <table className={styles.tabella}>
            <thead>
              <tr>
                <th scope="col">Titolo</th>
                <th scope="col" className={styles.soloLargo}>
                  Tipo
                </th>
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
                  <td className={styles.soloLargo}>{doc.tipo}</td>
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
