import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs, Pagination, TestataPagina } from '@/components'
import { SEZIONE_ALBO, SEZIONI_ALBO } from '@/lib/albo'
import {
  hrefAlbo,
  parseFiltriAlbo,
  sezioneValida,
  trovaAtti,
  valoriFiltriAlbo,
} from '@/lib/albo-dati'

import { AttoAlbo } from '../AttoAlbo'
import styles from '../albo.module.css'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ sezione: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { sezione } = await params
  if (!sezioneValida(sezione)) return {}
  const { pagina } = parseFiltriAlbo(await searchParams)
  const titolo = SEZIONE_ALBO[sezione].titolo
  return {
    title: pagina > 1 ? `${titolo} (pagina ${pagina})` : titolo,
    description: `Albo online dell’Accademia Albertina, ${titolo.toLowerCase()}: ${SEZIONE_ALBO[sezione].sommario}`,
    alternates: { canonical: hrefAlbo(sezione, { pagina }) },
  }
}

export default async function SezioneAlboPage({ params, searchParams }: Props) {
  const { sezione } = await params
  if (!sezioneValida(sezione)) notFound()
  const filtri = parseFiltriAlbo(await searchParams)
  const [risultati, valori] = await Promise.all([
    trovaAtti(sezione, filtri),
    valoriFiltriAlbo(sezione),
  ])
  const { titolo, sommario } = SEZIONE_ALBO[sezione]
  const filtrato = Boolean(filtri.q || filtri.categoria || filtri.anno || filtri.solo)

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Albo online', href: '/albo' },
          { label: titolo },
        ]}
      />
      <TestataPagina occhiello="Albo online" titolo={titolo} sommario={sommario} />

      <div className={styles.corpo}>
        <div className={styles.principale}>
          <form method="get" action={`/albo/${sezione}`} className={styles.filtri} role="search">
            <div className={styles.campo}>
              <label htmlFor="albo-q">Cerca</label>
              <input
                id="albo-q"
                type="search"
                name="q"
                defaultValue={filtri.q}
                placeholder="Titolo o documento"
              />
            </div>
            <div className={styles.campo}>
              <label htmlFor="albo-categoria">Categoria</label>
              <select id="albo-categoria" name="categoria" defaultValue={filtri.categoria}>
                <option value="">Tutte</option>
                {valori.categorie.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {valori.anni.length > 0 ? (
              <div className={styles.campo}>
                <label htmlFor="albo-anno">Anno</label>
                <select id="albo-anno" name="anno" defaultValue={filtri.anno}>
                  <option value="">Tutti</option>
                  {valori.anni.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <label className={styles.spunta}>
              <input
                type="checkbox"
                name="solo"
                value="aperti"
                defaultChecked={filtri.solo === 'aperti'}
              />
              Solo con scadenza aperta
            </label>
            <div className={styles.azioni}>
              <button type="submit" className="btn btn-secondario">
                Applica
              </button>
              {filtrato ? <Link href={`/albo/${sezione}`}>Azzera i filtri</Link> : null}
            </div>
          </form>

          <p className={styles.conteggio}>
            {risultati.totalDocs === 1 ? '1 atto' : `${risultati.totalDocs} atti`}
            {filtri.categoria ? ` in “${filtri.categoria}”` : ''}
          </p>

          {risultati.docs.length > 0 ? (
            <div className={styles.atti}>
              {risultati.docs.map((a) => (
                <AttoAlbo key={a.id} atto={a} />
              ))}
            </div>
          ) : (
            <p>
              Nessun atto trovato con questi filtri.{' '}
              <Link href={`/albo/${sezione}`}>Mostra tutti gli atti</Link>.
            </p>
          )}

          <Pagination
            page={risultati.page ?? 1}
            totalPages={risultati.totalPages}
            hrefFor={(p) => hrefAlbo(sezione, { ...filtri, pagina: p })}
          />
        </div>

        <nav aria-label="Sezioni dell’Albo" className={styles.lato}>
          <p className={styles.latoTitolo}>
            <Link href="/albo">Albo online</Link>
          </p>
          <ul>
            {SEZIONI_ALBO.map((s) => (
              <li key={s}>
                <Link href={`/albo/${s}`} aria-current={s === sezione ? 'page' : undefined}>
                  {SEZIONE_ALBO[s].titolo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
