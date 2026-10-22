import Link from 'next/link'

import { CONTATTI, MENU_FOOTER, MENU_LEGALE, SOCIAL } from '@/lib/navigazione'

import { MenuLink } from '../MenuLink/MenuLink'

import styles from './SiteFooter.module.css'

const ISTITUZIONI = [
  {
    nome: 'Ministero dell’Università e della Ricerca',
    href: 'https://www.mur.gov.it/it',
    logo: '/brand/mur.png',
    w: 87,
  },
  {
    nome: 'AFAM – Alta Formazione Artistica, Musicale e Coreutica',
    href: 'https://www.mur.gov.it/it/aree-tematiche/afam',
    logo: '/brand/afam.png',
    w: 91,
  },
]

export function SiteFooter({ anno = new Date().getFullYear() }: { anno?: number }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statico */}
            <img
              src="/brand/logo-albertina-bianco.svg"
              alt="Accademia Albertina di Belle Arti di Torino, home"
              width={175}
              height={80}
            />
          </Link>
          <p className={styles.ente}>
            Istituzione di Alta Formazione Artistica e Musicale (AFAM) del Ministero dell’Università
            e della Ricerca
          </p>
          <ul className={styles.istituzioni}>
            {ISTITUZIONI.map((i) => (
              <li key={i.href}>
                <a href={i.href} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- PNG statico già ottimizzato */}
                  <img
                    src={i.logo}
                    alt={`${i.nome} (si apre in una nuova scheda)`}
                    width={i.w}
                    height={80}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <section aria-labelledby="footer-contatti">
          <h2 id="footer-contatti" className={styles.title}>
            Contatti
          </h2>
          <address className={styles.address}>
            <a href={CONTATTI.mappa} target="_blank" rel="noopener noreferrer">
              {CONTATTI.indirizzo[0]}
              <br />
              {CONTATTI.indirizzo[1]}
              <span className="visually-hidden"> (mappa, si apre in una nuova scheda)</span>
            </a>
            <span>
              Tel. <a href={CONTATTI.telefono.href}>{CONTATTI.telefono.label}</a>
            </span>
            <span>
              PEO <a href={`mailto:${CONTATTI.peo}`}>{CONTATTI.peo}</a>
            </span>
            <span>
              PEC <a href={`mailto:${CONTATTI.pec}`}>{CONTATTI.pec}</a>
            </span>
          </address>
          <p className={styles.fiscal}>
            C.F. {CONTATTI.codiceFiscale} · P.IVA {CONTATTI.partitaIva}
          </p>
        </section>

        <nav aria-labelledby="footer-link">
          <h2 id="footer-link" className={styles.title}>
            Link utili
          </h2>
          <ul className={styles.list}>
            {MENU_FOOTER.map((v) => (
              <li key={v.href}>
                <MenuLink voce={v} />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-social">
          <h2 id="footer-social" className={styles.title}>
            Seguici
          </h2>
          <ul className={styles.list}>
            {SOCIAL.map((v) => (
              <li key={v.href}>
                <MenuLink voce={v} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p>© 2022–{anno} Accademia Albertina di Belle Arti di Torino</p>
          <nav aria-label="Note legali e accessibilità">
            <ul className={styles.legal}>
              {MENU_LEGALE.map((v) => (
                <li key={v.href}>
                  <MenuLink voce={v} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
