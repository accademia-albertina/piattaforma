import type { Metadata } from 'next'
import Link from 'next/link'

import { CATEGORIA_LABELS, CATEGORIE_AVVISI } from '@/access/avvisi'
import { AvvisoCard, Breadcrumbs, FiltriSchede, Pagination } from '@/components'
import {
  categorieAvviso,
  hrefAvvisi,
  parseFiltri,
  sommarioAvviso,
  trovaAvvisi,
  trovaScuole,
} from '@/lib/avvisi'

import styles from './avvisi.module.css'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria, pagina } = parseFiltri(await searchParams)
  const base = categoria ? `Avvisi: ${CATEGORIA_LABELS[categoria]}` : 'Avvisi'
  return {
    title: pagina > 1 ? `${base} (pagina ${pagina})` : base,
    description: 'Avvisi dell’Accademia Albertina su lezioni, esami, eventi, bandi e scadenze.',
    alternates: { canonical: hrefAvvisi({ categoria, pagina }) },
  }
}

export default async function AvvisiPage({ searchParams }: Props) {
  const filtri = parseFiltri(await searchParams)
  const scuole = await trovaScuole()
  const risultati = await trovaAvvisi(filtri, scuole)
  const scuolaAttiva = scuole.find((s) => s.slug === filtri.scuola)

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Avvisi' }]} />
      <h1>Avvisi</h1>

      <section aria-labelledby="filtri-titolo" className={styles.filters}>
        <h2 id="filtri-titolo" className="visually-hidden">
          Filtri
        </h2>
        <FiltriSchede
          label="Categorie degli avvisi"
          schede={[
            {
              label: 'Tutte',
              href: hrefAvvisi({ scuola: filtri.scuola }),
              attiva: !filtri.categoria,
            },
            ...CATEGORIE_AVVISI.map((c) => ({
              label: CATEGORIA_LABELS[c],
              href: hrefAvvisi({ categoria: c, scuola: filtri.scuola }),
              attiva: filtri.categoria === c,
            })),
          ]}
        />

        {scuole.length > 0 ? (
          <form method="get" action="/avvisi" className={styles.schoolForm}>
            {filtri.categoria ? (
              <input type="hidden" name="categoria" value={filtri.categoria} />
            ) : null}
            <label htmlFor="filtro-scuola">Scuola</label>
            <select id="filtro-scuola" name="scuola" defaultValue={filtri.scuola ?? ''}>
              <option value="">Tutte le scuole</option>
              {scuole.map((s) => (
                <option key={s.id} value={s.slug ?? ''}>
                  {s.nome}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondario">
              Applica
            </button>
          </form>
        ) : null}
      </section>

      <p className={styles.count}>
        {risultati.totalDocs === 1 ? '1 avviso' : `${risultati.totalDocs} avvisi`}
        {filtri.categoria ? ` in “${CATEGORIA_LABELS[filtri.categoria]}”` : ''}
        {scuolaAttiva ? ` per ${scuolaAttiva.nome}` : ''}
      </p>

      {risultati.docs.length > 0 ? (
        <ul className={styles.grid}>
          {risultati.docs.map((a) => (
            <li key={a.id}>
              <AvvisoCard
                titolo={a.titolo}
                href={`/avvisi/${a.slug}`}
                data={a.pubblicatoIl}
                sommario={sommarioAvviso(a)}
                categorie={categorieAvviso(a)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Nessun avviso trovato con questi filtri.{' '}
          <Link href="/avvisi">Mostra tutti gli avvisi</Link>.
        </p>
      )}

      <Pagination
        page={risultati.page ?? 1}
        totalPages={risultati.totalPages}
        hrefFor={(p) => hrefAvvisi({ ...filtri, pagina: p })}
      />
    </div>
  )
}
