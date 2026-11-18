import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Alert, Blocchi, Breadcrumbs, TestataPagina } from '@/components'
import { aTuttaLarghezza } from '@/components/Blocchi/Blocchi'
import { antenati, sottopagine, trovaPagina } from '@/lib/pagine'
import { type VoceSezione, vociSezione } from '@/lib/sezioni'

import styles from './pagina.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ percorso: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trovata = await trovaPagina((await params).percorso)
  if (!trovata) return { title: 'Pagina non trovata' }
  const { pagina, bozza } = trovata
  return {
    title: pagina.titolo,
    description: pagina.sommario ?? undefined,
    alternates: { canonical: `/${pagina.percorso}` },
    openGraph: { title: pagina.titolo, description: pagina.sommario ?? undefined },
    robots: bozza ? { index: false } : undefined,
  }
}

export default async function PaginaIstituzionale({ params }: Props) {
  const trovata = await trovaPagina((await params).percorso)
  if (!trovata) notFound()
  const { pagina, bozza } = trovata
  const genitore = typeof pagina.genitore === 'object' ? pagina.genitore : null
  // Indice (pagine genitore) e menu laterale (sottopagine) seguono il menu principale
  const [su, figlie, vicine] = await Promise.all([
    antenati(pagina),
    // Pagina di primo livello (Accademia, Didattica…): voci del menu; più in basso: sottopagine
    genitore
      ? sottopagine(pagina).then((f) =>
          f.map((p): VoceSezione => ({
            label: p.titolo,
            href: `/${p.percorso}`,
            sommario: p.sommario,
          })),
        )
      : vociSezione(pagina),
    genitore ? vociSezione(genitore) : Promise.resolve([]),
  ])
  const qui = `/${pagina.percorso}`

  // I contatti brevi vanno nella colonna laterale (da computer) o subito sotto la testata
  // (da telefono); un elenco lungo o con un titolo proprio (es. pagina Contatti) resta nel testo.
  const blocchi = pagina.blocchi ?? []
  const laterale = (b: (typeof blocchi)[number]) =>
    b.blockType === 'contatti' && !b.titolo && b.voci.length <= 3
  const contatti = blocchi.filter(laterale)
  // Fascia di foto e mappa vanno da bordo a bordo, in fondo alla pagina
  const piene = blocchi.filter(aTuttaLarghezza)
  const corpo = blocchi.filter((b) => !laterale(b) && !aTuttaLarghezza(b))
  const conSezione = vicine.length > 1
  const conLato = contatti.length > 0 || conSezione

  return (
    <>
      <article
        className={`container ${styles.page}`}
        data-con-fasce={piene.length ? true : undefined}
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            ...su.map((p) => ({ label: p.titolo, href: `/${p.percorso}` })),
            { label: pagina.titolo },
          ]}
        />
        {bozza ? (
          <Alert tone="warning" title="Anteprima">
            Stai vedendo una bozza: il pubblico vede ancora l’ultima versione pubblicata.
          </Alert>
        ) : null}

        <TestataPagina
          occhiello={genitore?.titolo}
          titolo={pagina.titolo}
          sommario={pagina.sommario}
        />

        <div className={styles.corpo} data-con-lato={conLato ? true : undefined}>
          {contatti.length > 0 ? (
            <div className={styles.contatti}>
              <Blocchi blocchi={contatti} variante="scheda" />
            </div>
          ) : null}

          {corpo.length > 0 ? (
            <div className={styles.principale}>
              <Blocchi blocchi={corpo} />
            </div>
          ) : null}

          {conSezione && genitore ? (
            <nav className={styles.sezione} aria-label={`Pagine della sezione ${genitore.titolo}`}>
              <h2 className={styles.sezioneTitolo}>
                <Link href={`/${genitore.percorso}`}>{genitore.titolo}</Link>
              </h2>
              <ul>
                {vicine.map((v) => (
                  <li key={v.href}>
                    {v.esterno ? (
                      <a href={v.href} target="_blank" rel="noopener noreferrer">
                        {v.label}
                        <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
                        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
                      </a>
                    ) : (
                      <Link href={v.href} aria-current={v.href === qui ? 'page' : undefined}>
                        {v.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        {figlie.length > 0 ? (
          <nav aria-labelledby="sottopagine" className={styles.figlie}>
            <div className={styles.figlieTesta}>
              <h2 id="sottopagine">In questa sezione</h2>
              <p>
                {figlie.length} {figlie.length === 1 ? 'pagina' : 'pagine'}
              </p>
            </div>
            <ul>
              {figlie.map((f) => {
                const contenuto = (
                  <>
                    <span className={styles.figliaTitolo}>{f.label}</span>
                    {f.sommario ? (
                      <span className={styles.figliaSommario}>{f.sommario}</span>
                    ) : null}
                    <span className={styles.figliaApri} aria-hidden="true">
                      {f.esterno ? (
                        <>
                          Visita <ArrowUpRight size={16} strokeWidth={1.5} />
                        </>
                      ) : (
                        <>
                          Apri <ArrowRight size={16} strokeWidth={1.5} />
                        </>
                      )}
                    </span>
                  </>
                )
                return (
                  <li key={f.href}>
                    {f.esterno ? (
                      <a href={f.href} target="_blank" rel="noopener noreferrer">
                        {contenuto}
                        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
                      </a>
                    ) : (
                      <Link href={f.href}>{contenuto}</Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
      </article>
      {piene.length > 0 ? <Blocchi blocchi={piene} variante="piena" /> : null}
    </>
  )
}
