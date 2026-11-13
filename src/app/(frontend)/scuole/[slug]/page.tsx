import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { idYoutube, nomeDipartimento } from '@/collections/Scuole'
import {
  AvvisoCard,
  Breadcrumbs,
  ElencoDocumenti,
  IconaScuola,
  SchedePercorso,
  TestataPagina,
  VideoYoutube,
} from '@/components'
import { Testo } from '@/components/Testo/Testo'
import { categorieAvviso, hrefAvvisi, sommarioAvviso } from '@/lib/avvisi'
import { immagineScuola } from '@/lib/immagineScuola'
import {
  LIVELLI,
  avvisiDellaScuola,
  docenteDi,
  docentiDellaScuola,
  trovaScuola,
} from '@/lib/scuole'
import type { Scuola } from '@/payload-types'

import styles from './scuola.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scuola = await trovaScuola((await params).slug)
  if (!scuola) return { title: 'Scuola non trovata' }
  return {
    title: `Scuola di ${scuola.nome}`,
    description:
      scuola.descrizione ||
      `Scuola di ${scuola.nome} dell’Accademia Albertina: triennio, biennio, piani di studio e docenti.`,
    alternates: { canonical: `/scuole/${scuola.slug}` },
  }
}

type Livello = keyof typeof LIVELLI

/** Contenuto di una scheda Triennio o Biennio. */
function Percorso({ scuola, livello }: { scuola: Scuola; livello: Livello }) {
  const p = scuola[livello]
  const info = LIVELLI[livello]
  const piani = (p?.piani ?? []).map((d) => ({ ...d, nota: null }))
  return (
    <div className={styles.percorso}>
      <p className={styles.livello}>
        {info.livello} · {info.anni} anni · {info.cfa} CFA
      </p>
      {(p?.sezioni ?? []).map((s) => (
        <section key={s.id} className={styles.sezione}>
          <h3>{s.titolo}</h3>
          {s.testo ? <Testo data={s.testo} /> : null}
        </section>
      ))}
      {piani.length > 0 ? (
        <section className={styles.sezione}>
          <h3>Piani di studio</h3>
          <ElencoDocumenti documenti={piani} />
        </section>
      ) : null}
    </div>
  )
}

export default async function ScuolaPage({ params }: Props) {
  const scuola = await trovaScuola((await params).slug)
  if (!scuola) notFound()

  const [docenti, avvisi] = await Promise.all([
    docentiDellaScuola(scuola.id),
    avvisiDellaScuola(scuola.id),
  ])
  const dipartimento = nomeDipartimento(scuola.dipartimento)
  const immagine = immagineScuola(scuola)
  const video = idYoutube(scuola.video)
  const coordinatoreDip = docenteDi(scuola.coordinatoreDipartimento)
  const coordinatore = docenteDi(scuola.coordinatoreScuola)

  const livelli = (['triennio', 'biennio'] as const).filter((l) => scuola[l]?.attivo !== false)
  const percorsi = livelli.map((l) => ({
    id: l,
    label: LIVELLI[l].titolo,
    contenuto: <Percorso scuola={scuola} livello={l} />,
  }))

  const foto = immagine ? (
    'src' in immagine ? (
      <Image src={immagine} alt="" placeholder="blur" sizes="(min-width: 64rem) 40vw, 100vw" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- immagine dal pannello
      <img
        src={immagine.url}
        alt=""
        width={immagine.width ?? undefined}
        height={immagine.height ?? undefined}
      />
    )
  ) : null

  const persona = (d: ReturnType<typeof docenteDi>) =>
    d ? <Link href={`/docenti/${d.slug}`}>{d.nomeCompleto}</Link> : null

  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Offerta formativa', href: '/scuole' },
          { label: scuola.nome },
        ]}
      />

      <TestataPagina
        occhiello={dipartimento}
        titolo={scuola.nome}
        sommario={scuola.descrizione}
        formatoMedia="copertina"
        media={
          foto ? (
            <div className={styles.media}>
              {foto}
              <span className={styles.icona}>
                <IconaScuola scuola={scuola.slug ?? ''} size={40} />
              </span>
            </div>
          ) : undefined
        }
      >
        <dl className={styles.dati}>
          <div>
            <dt>Percorsi</dt>
            <dd>{livelli.map((l) => LIVELLI[l].titolo).join(' e ')}</dd>
          </div>
          {coordinatore ? (
            <div>
              <dt>Coordinatore di scuola</dt>
              <dd>{persona(coordinatore)}</dd>
            </div>
          ) : null}
        </dl>
        <div className={styles.azioni}>
          <Link href={`/corsi?scuola=${scuola.slug}`} className="btn btn-primario">
            Corsi della scuola
          </Link>
          <Link href="/didattica/ammissioni" className="btn btn-secondario">
            Ammissioni
          </Link>
        </div>
      </TestataPagina>

      <div className={styles.corpo}>
        <section aria-labelledby="percorso-di-studi" className={styles.principale}>
          <h2 id="percorso-di-studi" className={styles.titoloSezione}>
            Il percorso di studi
          </h2>
          {percorsi.length > 0 ? (
            <SchedePercorso percorsi={percorsi} label={`Percorsi della Scuola di ${scuola.nome}`} />
          ) : (
            <p>Le informazioni sui percorsi sono in aggiornamento.</p>
          )}
        </section>

        <aside aria-labelledby="persone" className={styles.laterale}>
          <h2 id="persone" className={styles.titoloLaterale}>
            Persone
          </h2>
          <dl className={styles.persone}>
            {coordinatoreDip ? (
              <div>
                <dt>Coordinatore di dipartimento</dt>
                <dd>{persona(coordinatoreDip)}</dd>
              </div>
            ) : null}
            {coordinatore ? (
              <div>
                <dt>Coordinatore di scuola</dt>
                <dd>{persona(coordinatore)}</dd>
              </div>
            ) : null}
            {docenti.length > 0 ? (
              <div>
                <dt>Docenti</dt>
                <dd>
                  <ul className={styles.docenti}>
                    {docenti.map((d) => (
                      <li key={d.id}>
                        <Link href={`/docenti/${d.slug}`}>{d.nomeCompleto}</Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>

      {video ? (
        <section aria-labelledby="video" className={styles.blocco}>
          <h2 id="video" className="visually-hidden">
            Video della scuola
          </h2>
          <VideoYoutube id={video} titolo={`La Scuola di ${scuola.nome}`} copertina={foto} />
        </section>
      ) : null}

      <section aria-labelledby="iscriviti" className={styles.invito}>
        <div>
          <p className={styles.occhiello}>{scuola.nome}</p>
          <h2 id="iscriviti">Iscriviti alla Scuola di {scuola.nome}</h2>
        </div>
        <p>
          Consulta il calendario delle ammissioni per iniziare il tuo percorso accademico nella
          Scuola di {scuola.nome}.
        </p>
        <Link href="/didattica/ammissioni" className="btn btn-primario">
          Ammissioni <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
        </Link>
      </section>

      {avvisi.length > 0 ? (
        <section aria-labelledby="avvisi-scuola" className={styles.blocco}>
          <div className={styles.testaSezione}>
            <h2 id="avvisi-scuola" className={styles.titoloSezione}>
              Avvisi della scuola
            </h2>
            <Link href={hrefAvvisi({ scuola: scuola.slug ?? undefined })}>
              Tutti gli avvisi della scuola
            </Link>
          </div>
          <ul className={styles.avvisi}>
            {avvisi.map((a) => (
              <li key={a.id}>
                <AvvisoCard
                  titolo={a.titolo}
                  href={`/avvisi/${a.slug}`}
                  data={a.pubblicatoIl}
                  sommario={sommarioAvviso(a)}
                  categorie={categorieAvviso(a)}
                  headingLevel={3}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
