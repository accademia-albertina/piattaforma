import { Download } from 'lucide-react'
import type { Metadata } from 'next'

import { Breadcrumbs, IconaScuola, TestataPagina } from '@/components'
import {
  contrasto,
  GRUPPI_COLORI,
  ICONE,
  KIT,
  LOGHI,
  SCALA_TIPOGRAFICA,
  testoSopra,
} from '@/lib/designSystem'

import styles from './designSystem.module.css'

// Header e footer leggono il menu dal database a ogni richiesta, come nelle altre pagine
export const dynamic = 'force-dynamic'

const SOMMARIO =
  'Logo, stemma, icone delle scuole, colori e caratteri dell’Accademia Albertina, pronti da scaricare per documenti, locandine e progetti.'

export const metadata: Metadata = {
  title: 'Design System',
  description: SOMMARIO,
  alternates: { canonical: '/design-system' },
}

const rapporto = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 })

const SEZIONI = [
  { id: 'logo', titolo: 'Logo e stemma' },
  { id: 'icone', titolo: 'Icone delle scuole' },
  { id: 'colori', titolo: 'Colori' },
  { id: 'caratteri', titolo: 'Caratteri' },
  { id: 'pulsanti', titolo: 'Pulsanti e link' },
]

export default function DesignSystemPage() {
  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Design System' }]} />

      <TestataPagina occhiello="Identità visiva" titolo="Design System" sommario={SOMMARIO}>
        <a href={KIT.href} download className="btn btn-primario">
          <Download size={18} strokeWidth={1.75} aria-hidden /> Scarica tutto (ZIP, {KIT.peso})
        </a>
      </TestataPagina>

      <nav aria-label="In questa pagina" className={styles.indice}>
        <ul>
          {SEZIONI.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.titolo}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="logo" aria-labelledby="logo-titolo" className={styles.sezione}>
        <h2 id="logo-titolo">Logo e stemma</h2>
        <p className={styles.intro}>
          Usa sempre i file originali: non ridisegnare, deformare o ricolorare il logo e lascia
          attorno uno spazio libero almeno pari all’altezza della scritta “Accademia”.
        </p>
        <ul className={styles.loghi}>
          {LOGHI.map((l) => (
            <li key={l.nome} className={styles.logo}>
              <div className={styles.anteprimaLogo} data-sfondo={l.sfondo}>
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG ufficiale, servito così com'è */}
                <img src={l.anteprima} alt="" />
              </div>
              <div className={styles.datiLogo}>
                <h3>{l.nome}</h3>
                <p>{l.uso}</p>
                <p className={styles.scarica}>
                  {l.file.map((f) => (
                    <a key={f.href} href={f.href} download>
                      <Download size={16} strokeWidth={1.75} aria-hidden /> {f.etichetta}
                      <span className="visually-hidden"> ({l.nome})</span>
                    </a>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="icone" aria-labelledby="icone-titolo" className={styles.sezione}>
        <h2 id="icone-titolo">Icone delle scuole</h2>
        <p className={styles.intro}>
          Ogni scuola ha la sua icona. Il tratto si usa in un solo colore, su fondo chiaro o scuro;
          la versione con sfondo è già pronta per profili social e copertine.
        </p>
        <ul className={styles.icone}>
          {ICONE.map((i) => (
            <li key={i.scuola} className={styles.icona}>
              <div className={styles.coppia}>
                <IconaScuola scuola={i.scuola} size={56} />
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG ufficiale, servito così com'è */}
                <img src={`/design-system/icone-scuole-sfondo/${i.file}.svg`} alt="" width={56} height={56} />
              </div>
              <h3>{i.nome}</h3>
              <p className={styles.scarica}>
                <a href={`/design-system/icone-scuole/${i.file}.svg`} download>
                  <Download size={16} strokeWidth={1.75} aria-hidden /> Tratto
                  <span className="visually-hidden"> ({i.nome}, SVG)</span>
                </a>
                <a href={`/design-system/icone-scuole-sfondo/${i.file}.svg`} download>
                  <Download size={16} strokeWidth={1.75} aria-hidden /> Con sfondo
                  <span className="visually-hidden"> ({i.nome}, SVG)</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="colori" aria-labelledby="colori-titolo" className={styles.sezione}>
        <h2 id="colori-titolo">Colori</h2>
        <p className={styles.intro}>
          Il rosso è il colore dell’Accademia ma sul sito resta all’header e agli occhielli: per
          pulsanti e testi si usano le ardesie, per schede e pannelli gli azzurri. Accanto a ogni
          colore c’è il testo da metterci sopra e il suo contrasto (almeno 4,5:1 per il testo
          normale).
        </p>
        {GRUPPI_COLORI.map((g) => (
          <div key={g.titolo} className={styles.gruppo}>
            <h3>{g.titolo}</h3>
            <ul className={styles.colori}>
              {g.colori.map((c) => {
                const sopra = testoSopra(c.hex)
                return (
                  <li key={c.token} className={styles.colore}>
                    <div
                      className={styles.campione}
                      style={{
                        background: `var(${c.token})`,
                        color: sopra.nome === 'bianco' ? 'var(--color-on-brand)' : 'var(--color-text)',
                      }}
                      data-chiaro={contrasto(c.hex, '#ffffff') < 1.3 ? true : undefined}
                    >
                      <span>Aa</span>
                      <span className={styles.rapporto}>
                        {rapporto(sopra.rapporto)}:1 con {sopra.nome}
                      </span>
                    </div>
                    <div className={styles.datiColore}>
                      <p className={styles.nomeColore}>{c.nome}</p>
                      <p className={styles.codici}>
                        <code>{c.hex.toUpperCase()}</code> <code>{c.token}</code>
                      </p>
                      <p>{c.uso}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section id="caratteri" aria-labelledby="caratteri-titolo" className={styles.sezione}>
        <h2 id="caratteri-titolo">Caratteri</h2>
        <p className={styles.intro}>
          Un solo carattere per tutto: <strong>Albert Sans</strong>, libero e gratuito (licenza
          SIL Open Font License). Si usano quattro pesi: normale, medio, semigrassetto e grassetto.
        </p>
        <p>
          <a
            href="https://fonts.google.com/specimen/Albert+Sans"
            className="btn btn-secondario"
            target="_blank"
            rel="noreferrer"
          >
            Scarica Albert Sans da Google Fonts
            <span className="visually-hidden"> (si apre in una nuova scheda)</span>
          </a>
        </p>
        <dl className={styles.scala}>
          {SCALA_TIPOGRAFICA.map((t) => (
            <div key={t.token} className={styles.voceScala}>
              <dt>
                {t.nome}
                <span>
                  {t.misura} · peso {t.peso}
                </span>
              </dt>
              <dd
                style={{ fontSize: `var(${t.token})`, fontWeight: t.peso }}
                data-etichetta={t.token === '--font-size-2xs' ? true : undefined}
              >
                Accademia Albertina di Belle Arti
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="pulsanti" aria-labelledby="pulsanti-titolo" className={styles.sezione}>
        <h2 id="pulsanti-titolo">Pulsanti e link</h2>
        <p className={styles.intro}>
          I pulsanti non sono mai rossi, perché il rosso nelle interfacce segnala un’azione
          distruttiva. Il principale è pieno in ardesia scura, il secondario solo a filo. Ogni
          scheda ha un invito visibile, come “Vedi la scheda →”.
        </p>
        <div className={styles.esempi}>
          <a href={KIT.href} download className="btn btn-primario">
            Principale
          </a>
          <a href="#logo" className="btn btn-secondario">
            Secondario
          </a>
          <a href="#colori">Link nel testo</a>
        </div>
      </section>
    </div>
  )
}
