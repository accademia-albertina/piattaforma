import Link from 'next/link'

import { Alert, AvvisoCard, HeroSlider, SchedaScuola } from '@/components'
import { nomeDipartimento } from '@/collections/Scuole'
import {
  avvisiInEvidenza,
  categorieAvviso,
  sommarioAvviso,
  trovaScuole,
  ultimiAvvisi,
} from '@/lib/avvisi'
import { IMMAGINI_SCUOLE } from '@/lib/immagini-scuole'
import { immagineDiRepertorio } from '@/lib/repertorio'

import styles from './home.module.css'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [evidenza, avvisi, scuole] = await Promise.all([
    avvisiInEvidenza(5),
    ultimiAvvisi(6),
    trovaScuole(),
  ])

  return (
    <>
      <h1 className="visually-hidden">Accademia Albertina di Belle Arti di Torino</h1>
      <HeroSlider
        slides={evidenza.map((a) => ({
          titolo: a.titolo,
          href: `/avvisi/${a.slug}`,
          data: a.pubblicatoIl,
          immagine:
            typeof a.immagine === 'object' && a.immagine?.url
              ? { url: a.immagine.url, width: a.immagine.width, height: a.immagine.height }
              : (() => {
                  // Senza foto: repertorio della scuola o delle sedi, mai il fondo vuoto
                  const r = immagineDiRepertorio(
                    a.slug ?? a.titolo,
                    (a.scuole ?? []).flatMap((s) => (typeof s === 'object' && s.slug ? [s.slug] : [])),
                  )
                  return { url: r.src, width: r.width, height: r.height }
                })(),
        }))}
      />

      <div className={`container ${styles.page}`}>
        <section aria-labelledby="ultimi-avvisi" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="ultimi-avvisi">Ultimi avvisi</h2>
            <Link href="/avvisi">Tutti gli avvisi</Link>
          </div>
          {avvisi.length > 0 ? (
            <ul className={styles.grid}>
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
          ) : (
            <p>Non ci sono avvisi pubblicati.</p>
          )}
        </section>

        {scuole.length > 0 && (
          <section aria-labelledby="scuole" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="scuole">Le scuole</h2>
              <Link href="/corsi">Tutti i corsi</Link>
            </div>
            <ul className={styles.scuole}>
              {scuole.map((s) => {
                const caricata = typeof s.immagine === 'object' && s.immagine?.url ? s.immagine : null
                return (
                  <li key={s.id}>
                    <SchedaScuola
                      nome={s.nome}
                      slug={s.slug ?? ''}
                      href={`/corsi?scuola=${s.slug}`}
                      dipartimento={nomeDipartimento(s.dipartimento)}
                      immagine={
                        caricata
                          ? { url: caricata.url!, width: caricata.width, height: caricata.height }
                          : IMMAGINI_SCUOLE[s.slug ?? '']
                      }
                      invito="Vedi i corsi"
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <Alert tone="info" title="Sito in costruzione">
          <p>
            Il sito ufficiale resta <a href="https://albertina-academy.it">albertina-academy.it</a>{' '}
            fino al passaggio alla nuova piattaforma.
          </p>
        </Alert>
      </div>
    </>
  )
}
