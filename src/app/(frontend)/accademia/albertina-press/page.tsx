import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  Blocchi,
  Breadcrumbs,
  FiltriSchede,
  Pagination,
  SchedaPubblicazione,
  TestataPagina,
} from '@/components'
import { COLLANE, nomeCollana, PERCORSO_PRESS } from '@/collections/Pubblicazioni'
import { antenati, trovaPagina } from '@/lib/pagine'
import { hrefCatalogo, parseFiltriCatalogo, trovaPubblicazioni } from '@/lib/pubblicazioni'
import type { Media } from '@/payload-types'

import styles from './press.module.css'

export const dynamic = 'force-dynamic'

const PERCORSO = ['accademia', 'albertina-press']
const SOMMARIO = 'La casa editrice dell’Accademia: cataloghi, saggi e libri d’artista dal 2013.'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [pagina, filtri] = await Promise.all([trovaPagina(PERCORSO), searchParams])
  const { collana } = parseFiltriCatalogo(filtri)
  const titolo = pagina?.pagina.titolo ?? 'Albertina Press'
  return {
    title: collana ? `${titolo}: collana ${nomeCollana(collana)}` : titolo,
    description: pagina?.pagina.sommario ?? SOMMARIO,
    alternates: { canonical: PERCORSO_PRESS },
  }
}

/**
 * Catalogo Albertina Press. Titolo, sommario e testo sulla casa editrice vengono dalla pagina
 * "Albertina Press" in Pagine (la redazione li cambia dal pannello); i volumi dalla collezione.
 */
export default async function AlbertinaPressPage({ searchParams }: Props) {
  const filtri = parseFiltriCatalogo(await searchParams)
  const [trovata, risultati] = await Promise.all([
    trovaPagina(PERCORSO),
    trovaPubblicazioni(filtri),
  ])
  const pagina = trovata?.pagina
  const su = pagina ? await antenati(pagina) : [{ titolo: 'Accademia', percorso: 'accademia' }]
  const titolo = pagina?.titolo ?? 'Albertina Press'
  const n = risultati.totalDocs

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          ...su.map((p) => ({ label: p.titolo, href: `/${p.percorso}` })),
          { label: titolo },
        ]}
      />
      <TestataPagina
        occhiello={su.at(-1)?.titolo}
        titolo={titolo}
        sommario={pagina?.sommario ?? SOMMARIO}
        media={
          <Image
            src="/brand/albertina-press.svg"
            alt="Albertina Press"
            width={359}
            height={82}
            className={styles.logo}
            unoptimized
            priority
          />
        }
      />

      {/* Prima la casa editrice, poi il catalogo (Fede 2026-11-13) */}
      {pagina?.blocchi?.length ? (
        <section aria-labelledby="casa-editrice" className={styles.casaEditrice}>
          <h2 id="casa-editrice">La casa editrice</h2>
          <Blocchi blocchi={pagina.blocchi} />
        </section>
      ) : null}

      <section id="catalogo" aria-labelledby="catalogo-titolo" className={styles.catalogo}>
        <h2 id="catalogo-titolo">Il catalogo</h2>
        <div className={styles.filtri}>
          <FiltriSchede
            label="Collane"
            schede={[
              { label: 'Tutte', href: hrefCatalogo({ q: filtri.q }), attiva: !filtri.collana },
              ...COLLANE.map((c) => ({
                label: c.label,
                href: hrefCatalogo({ collana: c.value, q: filtri.q }),
                attiva: filtri.collana === c.value,
              })),
            ]}
          />
          <form
            method="get"
            action={`${PERCORSO_PRESS}#catalogo`}
            className={styles.cerca}
            role="search"
          >
            {filtri.collana ? <input type="hidden" name="collana" value={filtri.collana} /> : null}
            <label htmlFor="cerca-catalogo">Cerca nel catalogo</label>
            <input
              id="cerca-catalogo"
              type="search"
              name="q"
              defaultValue={filtri.q ?? ''}
              placeholder="Titolo, autore o ISBN"
              maxLength={80}
            />
            <button type="submit" className="btn btn-secondario">
              Cerca
            </button>
          </form>
        </div>

        <p className={styles.conteggio} aria-live="polite">
          {n === 1 ? '1 pubblicazione' : `${n} pubblicazioni`}
          {filtri.collana ? ` nella collana ${nomeCollana(filtri.collana)}` : ''}
          {filtri.q ? ` per “${filtri.q}”` : ''}
        </p>

        {risultati.docs.length > 0 ? (
          <ul className={styles.schede}>
            {risultati.docs.map((p) => {
              const c = typeof p.copertina === 'object' ? (p.copertina as Media | null) : null
              return (
                <li key={p.id}>
                  <SchedaPubblicazione
                    titolo={p.titolo}
                    href={`${PERCORSO_PRESS}/${p.slug}`}
                    collana={nomeCollana(p.collana)}
                    anno={p.anno}
                    copertina={c?.url ? { url: c.url, width: c.width, height: c.height } : null}
                    livello={3}
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <p>
            Nessuna pubblicazione trovata.{' '}
            <Link href={hrefCatalogo({})}>Mostra tutto il catalogo</Link>.
          </p>
        )}

        <Pagination
          page={risultati.page ?? 1}
          totalPages={risultati.totalPages}
          hrefFor={(p) => hrefCatalogo({ ...filtri, pagina: p })}
        />
      </section>
    </div>
  )
}
