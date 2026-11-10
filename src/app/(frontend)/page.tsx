import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import aulaPittura from '@/assets/repertorio/aula-pittura.webp'
import rotonda from '@/assets/repertorio/rotonda.webp'
import salaBlu from '@/assets/repertorio/sala-blu.webp'
import scalone from '@/assets/repertorio/scalone.webp'
import {
  AccessiRapidi,
  Alert,
  AvvisoCard,
  HeroSlider,
  IntroAccademia,
  InvitoTour,
  SchedaScuola,
  SchedePercorso,
} from '@/components'
import { nomeDipartimento } from '@/collections/Scuole'
import type { Avviso } from '@/payload-types'
import {
  avvisiInEvidenza,
  categorieAvviso,
  hrefAvvisi,
  sommarioAvviso,
  trovaScuole,
  ultimiAvvisi,
} from '@/lib/avvisi'
import { ACCESSI_HOME } from '@/lib/accessi-home'
import { IMMAGINI_SCUOLE } from '@/lib/immagini-scuole'
import { immagineDiRepertorio } from '@/lib/repertorio'

import styles from './home.module.css'

export const dynamic = 'force-dynamic'

const TOUR = 'https://tour.albertina-academy.it/'

const MANIFESTO =
  'Dal 1678 Torino ha la sua scuola d’arte. Dieci scuole, dalla pittura al cinema, dalla scultura alle nuove tecnologie. Un palazzo nel centro della città, una pinacoteca, i laboratori. Qui si impara un mestiere antico e si cerca la propria stella.'

/** Griglia di avvisi di una scheda, con un collegamento all'elenco completo. */
function GrigliaAvvisi({
  avvisi,
  vuoto,
  altri,
}: {
  avvisi: Avviso[]
  vuoto: string
  altri?: { label: string; href: string }[]
}) {
  return (
    <div className={styles.pannelloAvvisi}>
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
        <p>{vuoto}</p>
      )}
      {altri && (
        <p className={styles.altri}>
          {altri.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label} <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </Link>
          ))}
        </p>
      )}
    </div>
  )
}

export default async function HomePage() {
  const [evidenza, avvisi, didattica, bandi, scuole] = await Promise.all([
    avvisiInEvidenza(5),
    ultimiAvvisi(6),
    ultimiAvvisi(6, ['lezioni', 'esami']),
    ultimiAvvisi(6, ['bandi-e-concorsi']),
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
                    (a.scuole ?? []).flatMap((s) =>
                      typeof s === 'object' && s.slug ? [s.slug] : [],
                    ),
                  )
                  return { url: r.src, width: r.width, height: r.height }
                })(),
        }))}
      />

      <AccessiRapidi voci={ACCESSI_HOME} />

      <IntroAccademia
        foto={scalone}
        dettagli={[salaBlu, aulaPittura]}
        testo={MANIFESTO}
        cifre={[
          { valore: 1678, etichetta: 'Anno di fondazione' },
          { valore: 10, etichetta: 'Scuole' },
          { valore: 2, etichetta: 'Livelli di diploma, triennio e biennio' },
        ]}
      />

      <div className={`container ${styles.page}`}>
        <section aria-labelledby="ultimi-avvisi" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="ultimi-avvisi">Ultimi avvisi</h2>
            <Link href="/avvisi">Tutti gli avvisi</Link>
          </div>
          <SchedePercorso
            label="Filtra gli avvisi"
            percorsi={[
              {
                id: 'tutti',
                label: 'Tutti',
                contenuto: <GrigliaAvvisi avvisi={avvisi} vuoto="Non ci sono avvisi pubblicati." />,
              },
              {
                id: 'didattica',
                label: 'Lezioni ed esami',
                contenuto: (
                  <GrigliaAvvisi
                    avvisi={didattica}
                    vuoto="Non ci sono avvisi su lezioni ed esami."
                    altri={[
                      { label: 'Avvisi sulle lezioni', href: hrefAvvisi({ categoria: 'lezioni' }) },
                      { label: 'Avvisi sugli esami', href: hrefAvvisi({ categoria: 'esami' }) },
                    ]}
                  />
                ),
              },
              {
                id: 'bandi',
                label: 'Bandi e concorsi',
                contenuto: (
                  <GrigliaAvvisi
                    avvisi={bandi}
                    vuoto="Non ci sono bandi aperti."
                    altri={[
                      {
                        label: 'Tutti i bandi e concorsi',
                        href: hrefAvvisi({ categoria: 'bandi-e-concorsi' }),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </section>

        {scuole.length > 0 && (
          <section aria-labelledby="scuole" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="scuole">Le scuole</h2>
              <Link href="/scuole">Offerta formativa</Link>
            </div>
            <ul className={styles.scuole}>
              <li className={styles.introScuole}>
                <p className={styles.occhiello}>Offerta formativa</p>
                <p className={styles.introTitolo}>{scuole.length} scuole, due livelli di diploma</p>
                <p>
                  Diplomi accademici equiparati alle lauree universitarie: triennio di primo livello
                  e biennio specialistico.
                </p>
                <dl className={styles.cifre}>
                  <div>
                    <dt>Triennio</dt>
                    <dd>180 CFA</dd>
                  </div>
                  <div>
                    <dt>Biennio</dt>
                    <dd>120 CFA</dd>
                  </div>
                </dl>
                <Link href="/scuole" className={styles.introLink}>
                  Come si arriva al diploma <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
              {scuole.map((s) => {
                const caricata =
                  typeof s.immagine === 'object' && s.immagine?.url ? s.immagine : null
                return (
                  <li key={s.id}>
                    <SchedaScuola
                      nome={s.nome}
                      slug={s.slug ?? ''}
                      href={`/scuole/${s.slug}`}
                      dipartimento={nomeDipartimento(s.dipartimento)}
                      immagine={
                        caricata
                          ? { url: caricata.url!, width: caricata.width, height: caricata.height }
                          : IMMAGINI_SCUOLE[s.slug ?? '']
                      }
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

      <InvitoTour href={TOUR} immagine={rotonda} />
    </>
  )
}
