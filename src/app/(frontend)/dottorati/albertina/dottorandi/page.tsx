import type { Metadata } from 'next'

import { Blocchi, Breadcrumbs, SchedaDottorando, TestataPagina } from '@/components'
import { CURRICULUM_LABELS } from '@/collections/Dottorandi'
import { trovaDottorandi } from '@/lib/dottorandi'
import { antenati, trovaPagina } from '@/lib/pagine'
import type { Media } from '@/payload-types'

import styles from './dottorandi.module.css'

export const dynamic = 'force-dynamic'

const PERCORSO = ['dottorati', 'albertina', 'dottorandi']
const SOMMARIO =
  'Chi sono i dottorandi del Dottorato di ricerca dell’Accademia Albertina e su cosa lavorano.'

export async function generateMetadata(): Promise<Metadata> {
  const pagina = (await trovaPagina(PERCORSO))?.pagina
  return {
    title: pagina?.titolo ?? 'Dottorandi',
    description: pagina?.sommario ?? SOMMARIO,
    alternates: { canonical: `/${PERCORSO.join('/')}` },
  }
}

/**
 * Elenco dei dottorandi. Titolo, sommario ed eventuale testo introduttivo vengono dalla pagina
 * "Dottorandi" in Pagine (così la redazione li cambia dal pannello); le schede dalla collezione.
 */
export default async function DottorandiPage() {
  const [trovata, gruppi] = await Promise.all([trovaPagina(PERCORSO), trovaDottorandi()])
  const pagina = trovata?.pagina
  const su = pagina
    ? await antenati(pagina)
    : [
        { titolo: 'Dottorati', percorso: 'dottorati' },
        { titolo: 'Dottorati Accademia Albertina', percorso: 'dottorati/albertina' },
      ]
  const titolo = pagina?.titolo ?? 'Dottorandi'
  const totale = gruppi.reduce((n, g) => n + g.voci.length, 0)
  // Con un solo gruppo senza ciclo non serve il titolo di gruppo: il nome resta un h2
  const conGruppi = gruppi.some((g) => g.ciclo)

  const schede = (voci: (typeof gruppi)[number]['voci']) => (
    <ul className={styles.schede}>
      {voci.map((d) => {
        const foto = typeof d.foto === 'object' ? (d.foto as Media | null) : null
        return (
          <li key={d.id}>
            <SchedaDottorando
              nome={d.nomeCompleto ?? `${d.nome} ${d.cognome}`}
              href={`/${PERCORSO.join('/')}/${d.slug}`}
              dettaglio={d.curriculum ? CURRICULUM_LABELS[d.curriculum] : null}
              progetto={d.titoloProgetto}
              foto={foto?.url ? { url: foto.url, width: foto.width, height: foto.height } : null}
              livello={conGruppi ? 3 : 2}
            />
          </li>
        )
      })}
    </ul>
  )

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
      />

      {pagina?.blocchi?.length ? (
        <div className={styles.intro}>
          <Blocchi blocchi={pagina.blocchi} />
        </div>
      ) : null}

      {totale === 0 ? (
        <p>L’elenco dei dottorandi non è ancora disponibile.</p>
      ) : conGruppi ? (
        <div className={styles.gruppi}>
          {gruppi.map((g) => {
            const id = `ciclo-${g.ciclo ?? 'altri'}`
            return (
              <section key={id} aria-labelledby={id}>
                <div className={styles.gruppoTesta}>
                  <h2 id={id}>{g.ciclo ? `${g.ciclo} ciclo` : 'Altri dottorandi'}</h2>
                  <p>
                    {g.voci.length} {g.voci.length === 1 ? 'dottorando' : 'dottorandi'}
                  </p>
                </div>
                {schede(g.voci)}
              </section>
            )
          })}
        </div>
      ) : (
        schede(gruppi[0].voci)
      )}
    </div>
  )
}
