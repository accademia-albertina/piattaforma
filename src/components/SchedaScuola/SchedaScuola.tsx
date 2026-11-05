import { ArrowRight } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'

import { IconaScuola } from '../IconaScuola/IconaScuola'
import styles from './SchedaScuola.module.css'

type ImmagineCms = { url: string; width?: number | null; height?: number | null }

export type SchedaScuolaProps = {
  nome: string
  slug: string
  href: string
  dipartimento?: string | null
  /** Foto di repertorio (statica) o caricata nel pannello. */
  immagine?: StaticImageData | ImmagineCms | null
  /** Testo dell'invito, es. "Scopri di più". */
  invito?: string
  livello?: 2 | 3
}

const statica = (i: StaticImageData | ImmagineCms): i is StaticImageData => 'src' in i

/** Scheda di una scuola: foto, icona ufficiale, nome, dipartimento e invito. */
export function SchedaScuola({
  nome,
  slug,
  href,
  dipartimento,
  immagine,
  invito = 'Scopri di più',
  livello = 3,
}: SchedaScuolaProps) {
  const Titolo = `h${livello}` as 'h2' | 'h3'
  return (
    <Link href={href} className={styles.scheda}>
      {immagine ? (
        statica(immagine) ? (
          <Image
            src={immagine}
            alt=""
            sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
            placeholder="blur"
            className={styles.foto}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- immagine dal pannello, già ottimizzata
          <img
            src={immagine.url}
            alt=""
            width={immagine.width ?? undefined}
            height={immagine.height ?? undefined}
            loading="lazy"
            className={styles.foto}
          />
        )
      ) : null}
      <span className={styles.contenuto}>
        <span className={styles.icona}>
          <IconaScuola scuola={slug} size={30} />
        </span>
        <Titolo className={styles.nome}>{nome}</Titolo>
        {dipartimento ? <span className={styles.dipartimento}>{dipartimento}</span> : null}
        <span className={styles.invito}>
          {invito} <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
        </span>
      </span>
    </Link>
  )
}
