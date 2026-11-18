import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  FileText,
  GraduationCap,
  Info,
  Mail,
  MapPin,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { StaticImageData } from 'next/image'

import aulaPittura from '@/assets/repertorio/aula-pittura.webp'
import facciata from '@/assets/repertorio/facciata.webp'
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
import type { Avviso, Media } from '@/payload-types'
import {
  avvisiInEvidenza,
  categorieAvviso,
  hrefAvvisi,
  sommarioAvviso,
  trovaScuole,
  ultimiAvvisi,
} from '@/lib/avvisi'
import { HOME_PREDEFINITA as P, type IconaHome } from '@/lib/home'
import { risolviLink } from '@/lib/link'
import { payloadClient } from '@/lib/payload'
import { IMMAGINI_SCUOLE } from '@/lib/immagini-scuole'
import { immagineDiRepertorio } from '@/lib/repertorio'

import styles from './home.module.css'

export const dynamic = 'force-dynamic'

const ICONE: Record<IconaHome, LucideIcon> = {
  ammissioni: DoorOpen,
  laurea: GraduationCap,
  calendario: CalendarDays,
  segreteria: ClipboardList,
  libro: BookOpen,
  persone: Users,
  documento: FileText,
  luogo: MapPin,
  email: Mail,
  info: Info,
}

/** Foto caricata nel pannello nel formato di next/image, altrimenti quella di repertorio. */
function fotoOppure(m: number | Media | null | undefined, predefinita: StaticImageData) {
  return typeof m === 'object' && m?.url && m.width && m.height
    ? { src: m.url, width: m.width, height: m.height }
    : predefinita
}

/** Contenuti modificabili dal pannello (global Home); senza database restano i predefiniti. */
async function contenutiHome() {
  const h = await payloadClient()
    .then((payload) => payload.findGlobal({ slug: 'home', depth: 1, overrideAccess: false }))
    .catch(() => null)
  const accessi = (h?.accessi ?? []).flatMap((a) => {
    const link = risolviLink({ ...a, etichetta: a.titolo })
    return link
      ? [{ titolo: a.titolo, testo: a.testo, href: link.href, icona: ICONE[a.icona] }]
      : []
  })
  const dettagli = (h?.fotoDettagli ?? []).filter(
    (m): m is Media => typeof m === 'object' && Boolean(m?.url && m.width && m.height),
  )
  return {
    slider: h?.sliderNumero || P.slider.numero,
    accessiTitolo: h?.accessiTitolo || P.accessiTitolo,
    accessiTesto: h?.accessiTesto || P.accessiTesto,
    accessi:
      accessi.length > 0
        ? accessi
        : P.accessi.map((a) => ({ ...a, href: a.url, icona: ICONE[a.icona] })),
    manifesto: h?.manifesto || P.manifesto,
    foto: fotoOppure(h?.fotoGrande, scalone),
    dettagli: (dettagli.length === 2
      ? dettagli.map((m) => fotoOppure(m, salaBlu))
      : [salaBlu, aulaPittura]) as [StaticImageData, StaticImageData],
    cifre: h?.cifre?.length ? h.cifre : P.cifre,
    scuoleTitolo: h?.scuoleTitolo || P.scuoleTitolo,
    scuoleTesto: h?.scuoleTesto || P.scuoleTesto,
    avviso: {
      mostra: h ? h.avvisoMostra !== false : P.avviso.mostra,
      titolo: h?.avvisoTitolo || P.avviso.titolo,
      testo: h?.avvisoTesto || P.avviso.testo,
    },
    tour: {
      titolo: h?.tourTitolo || P.tour.titolo,
      testo: h?.tourTesto || P.tour.testo,
      url: h?.tourUrl || P.tour.url,
      foto: fotoOppure(h?.tourFoto, facciata),
    },
  }
}

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
  const home = await contenutiHome()
  const [evidenza, avvisi, didattica, bandi, scuole] = await Promise.all([
    avvisiInEvidenza(home.slider),
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

      <AccessiRapidi titolo={home.accessiTitolo} testo={home.accessiTesto} voci={home.accessi} />

      <IntroAccademia
        foto={home.foto}
        dettagli={home.dettagli}
        testo={home.manifesto}
        cifre={home.cifre.map(({ valore, etichetta }) => ({ valore, etichetta }))}
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
                <p className={styles.introTitolo}>
                  {scuole.length} scuole, {home.scuoleTitolo}
                </p>
                <p>{home.scuoleTesto}</p>
                <dl className={styles.cifre}>
                  <div>
                    <dt>Laurea</dt>
                    <dd>180 CFA</dd>
                  </div>
                  <div>
                    <dt>Laurea magistrale</dt>
                    <dd>120 CFA</dd>
                  </div>
                </dl>
                <Link href="/scuole" className={styles.introLink}>
                  Come si arriva alla laurea <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
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

        {home.avviso.mostra && (
          <Alert tone="info" title={home.avviso.titolo}>
            <p>{home.avviso.testo}</p>
          </Alert>
        )}
      </div>

      <InvitoTour
        href={home.tour.url}
        immagine={home.tour.foto}
        titolo={home.tour.titolo}
        testo={home.tour.testo}
      />
    </>
  )
}
