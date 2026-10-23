import type { Metadata } from 'next'
import Link from 'next/link'

import { LIVELLI, LIVELLO_LABELS, annoAccademicoCorrente } from '@/access/corsi'
import { Breadcrumbs } from '@/components'
import { trovaScuole } from '@/lib/avvisi'
import {
  anniAccademici,
  docentiDi,
  etichettaLivelli,
  hrefCorsi,
  parseFiltriCorsi,
  trovaCorsi,
} from '@/lib/corsi'

import styles from './corsi.module.css'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtri = parseFiltriCorsi(await searchParams)
  return {
    title: `Corsi A.A. ${filtri.anno}`,
    description:
      'Programmi dei corsi di Triennio e Biennio dell’Accademia Albertina: docenti, crediti, orari e bibliografia.',
    alternates: { canonical: hrefCorsi({ anno: filtri.anno }) },
  }
}

export default async function CorsiPage({ searchParams }: Props) {
  const filtri = parseFiltriCorsi(await searchParams)
  const [scuole, anni] = await Promise.all([trovaScuole(), anniAccademici()])
  const corsi = await trovaCorsi(filtri, scuole)
  const scuolaAttiva = scuole.find((s) => s.slug === filtri.scuola)
  const archivio = filtri.anno !== annoAccademicoCorrente()
  const filtrato = !!(filtri.q || filtri.livello || filtri.scuola)

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Corsi' }]} />
      <header className={styles.header}>
        <h1>Corsi</h1>
        <p className={styles.intro}>
          Programmi dei corsi di Triennio e Biennio
          {archivio ? ` dell’anno accademico ${filtri.anno} (archivio)` : ''}: docenti, crediti,
          orari e bibliografia.
        </p>
      </header>

      <form method="get" action="/corsi" className={styles.filters} role="search">
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="corsi-q">Corso o docente</label>
          <input
            id="corsi-q"
            name="q"
            type="search"
            defaultValue={filtri.q ?? ''}
            maxLength={100}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="corsi-livello">Livello</label>
          <select id="corsi-livello" name="livello" defaultValue={filtri.livello ?? ''}>
            <option value="">Triennio e Biennio</option>
            {LIVELLI.map((l) => (
              <option key={l} value={l}>
                {LIVELLO_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="corsi-scuola">Scuola</label>
          <select id="corsi-scuola" name="scuola" defaultValue={filtri.scuola ?? ''}>
            <option value="">Tutte le scuole</option>
            {scuole.map((s) => (
              <option key={s.id} value={s.slug ?? ''}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="corsi-anno">Anno accademico</label>
          <select id="corsi-anno" name="anno" defaultValue={filtri.anno.replace('/', '-')}>
            {anni.map((a) => (
              <option key={a} value={a.replace('/', '-')}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.apply}>
          Cerca
        </button>
      </form>

      <p className={styles.count} role="status">
        {corsi.length === 1 ? '1 corso' : `${corsi.length} corsi`}
        {filtri.q ? ` per “${filtri.q}”` : ''}
        {filtri.livello ? ` · ${LIVELLO_LABELS[filtri.livello]}` : ''}
        {scuolaAttiva ? ` · ${scuolaAttiva.nome}` : ''}
        {filtrato ? (
          <>
            {' · '}
            <Link href={hrefCorsi({ anno: filtri.anno })}>Togli i filtri</Link>
          </>
        ) : null}
      </p>

      {corsi.length > 0 ? (
        <table className={styles.table}>
          <caption className="visually-hidden">Corsi dell’anno accademico {filtri.anno}</caption>
          <thead>
            <tr>
              <th scope="col">Corso</th>
              <th scope="col">Livello</th>
              <th scope="col">Docente</th>
              <th scope="col" className={styles.num}>
                <abbr title="Crediti formativi accademici">CFA</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {corsi.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <Link href={`/corsi/${c.slug}`} className={styles.corso}>
                    {c.titolo}
                  </Link>
                </th>
                <td data-label="Livello">{etichettaLivelli(c.livelli)}</td>
                <td data-label="Docente">
                  {docentiDi(c).map((d, i) => (
                    <span key={d.id}>
                      {i > 0 ? ', ' : ''}
                      <Link href={`/docenti/${d.slug}`}>{d.nomeCompleto}</Link>
                    </span>
                  ))}
                </td>
                <td data-label="CFA" className={styles.num}>
                  {c.crediti ?? '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>
          Nessun corso trovato.{' '}
          <Link href={hrefCorsi({ anno: filtri.anno })}>Mostra tutti i corsi</Link>.
        </p>
      )}
    </div>
  )
}
