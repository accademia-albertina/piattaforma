import { Testo } from '@/components/Testo/Testo'
import { emailSpezzabile } from '@/utilities/email'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { risolviLink } from '@/lib/link'
import type { Media, Pagina } from '@/payload-types'

import { Attachments } from '../Attachments/Attachments'
import { Fisarmonica } from '../Fisarmonica/Fisarmonica'

import styles from './Blocchi.module.css'

export type Blocco = NonNullable<Pagina['blocchi']>[number]

const media = (m: number | Media | null | undefined) =>
  m && typeof m === 'object' && m.url ? m : null

function Immagine({ m, didascalia }: { m: Media; didascalia?: string | null }) {
  return (
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element -- l'ottimizzazione arriva con lo storage su Drive */}
      <img
        src={m.url!}
        alt={m.alt}
        width={m.width ?? undefined}
        height={m.height ?? undefined}
        loading="lazy"
        decoding="async"
      />
      {didascalia ? <figcaption>{didascalia}</figcaption> : null}
    </figure>
  )
}

/** Titolo di sezione e id per aria-labelledby, se il blocco ne ha uno. */
function Sezione({
  id,
  titolo,
  className,
  children,
}: {
  id: string
  titolo?: string | null
  className?: string
  children: React.ReactNode
}) {
  const hid = `${id}-titolo`
  return (
    <section
      className={`${styles.blocco} ${className ?? ''}`}
      aria-labelledby={titolo ? hid : undefined}
    >
      {titolo ? (
        <h2 id={hid} className={styles.titolo}>
          {titolo}
        </h2>
      ) : null}
      {children}
    </section>
  )
}

function RenderBlocco({ b, i }: { b: Blocco; i: number }) {
  const id = `b${b.id ?? i}`
  switch (b.blockType) {
    case 'testo':
      return <Testo data={b.testo} className={`${styles.blocco} ${styles.testo}`} />

    case 'immagine': {
      const m = media(b.immagine)
      if (!m) return null
      return (
        <div
          className={`${styles.blocco} ${b.larghezza === 'piena' ? styles.piena : styles.stretta}`}
        >
          <Immagine m={m} didascalia={b.didascalia} />
        </div>
      )
    }

    case 'galleria':
      return (
        <Sezione id={id} titolo={b.titolo}>
          <ul className={styles.galleria}>
            {b.immagini.map((im, k) => {
              const m = media(im.immagine)
              return m ? (
                <li key={im.id ?? k}>
                  <Immagine m={m} didascalia={im.didascalia} />
                </li>
              ) : null
            })}
          </ul>
        </Sezione>
      )

    case 'link':
      return (
        <Sezione id={id} titolo={b.titolo}>
          <ul className={styles.link}>
            {b.voci.map((v, k) => {
              const l = risolviLink(v)
              if (!l) return null
              const contenuto = (
                <>
                  <span className={styles.linkNome}>
                    {l.label}
                    {l.esterno ? (
                      <>
                        {' '}
                        <ArrowUpRight
                          size={14}
                          strokeWidth={1.75}
                          aria-hidden
                          className={styles.esterno}
                        />
                        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
                      </>
                    ) : null}
                  </span>
                  {v.descrizione ? <span className={styles.linkDesc}>{v.descrizione}</span> : null}
                </>
              )
              return (
                <li key={v.id ?? k}>
                  {l.esterno ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {contenuto}
                    </a>
                  ) : (
                    <Link href={l.href}>{contenuto}</Link>
                  )}
                </li>
              )
            })}
          </ul>
        </Sezione>
      )

    case 'fisarmonica':
      return (
        <Sezione id={id} titolo={b.titolo}>
          <Fisarmonica
            livello={b.titolo ? 3 : 2}
            voci={b.voci.map((v, k) => ({
              id: v.id ?? `${id}-${k}`,
              titolo: v.titolo,
              contenuto: <Testo data={v.testo} />,
            }))}
          />
        </Sezione>
      )

    case 'contatti':
      return (
        <Sezione id={id} titolo={b.titolo}>
          <ul className={styles.contatti}>
            {b.voci.map((c, k) => (
              <li key={c.id ?? k} className={styles.contatto}>
                <p className={styles.contattoNome}>{c.nome}</p>
                {c.ruolo ? <p className={styles.contattoRuolo}>{c.ruolo}</p> : null}
                <dl>
                  {c.email ? (
                    <>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${c.email}`}>{emailSpezzabile(c.email)}</a>
                      </dd>
                    </>
                  ) : null}
                  {c.telefono ? (
                    <>
                      <dt>Telefono</dt>
                      <dd>
                        <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`}>{c.telefono}</a>
                      </dd>
                    </>
                  ) : null}
                  {c.orari ? (
                    <>
                      <dt>Orari</dt>
                      <dd className={styles.orari}>{c.orari}</dd>
                    </>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </Sezione>
      )

    case 'allegati':
      return (
        <div className={styles.blocco}>
          <Attachments
            id={`${id}-titolo`}
            title={b.titolo || 'Allegati'}
            items={b.documenti.flatMap((a) => {
              const f = media(a.file)
              return f
                ? [
                    {
                      nome: a.nome,
                      url: f.url!,
                      filename: f.filename,
                      mimeType: f.mimeType,
                      filesize: f.filesize,
                    },
                  ]
                : []
            })}
          />
        </div>
      )

    default:
      return null
  }
}

/** Contenuto di una pagina composta a blocchi dal pannello. */
export function Blocchi({ blocchi }: { blocchi: Blocco[] | null | undefined }) {
  if (!blocchi?.length) return null
  return (
    <div className={styles.blocchi}>
      {blocchi.map((b, i) => (
        <RenderBlocco key={b.id ?? i} b={b} i={i} />
      ))}
    </div>
  )
}
