import { Testo } from '@/components/Testo/Testo'
import { emailSpezzabile } from '@/utilities/email'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { risolviLink } from '@/lib/link'
import { slugScuolaDaLink } from '@/utilities/linkScuola'
import { attributiFile } from '@/utilities/pdf'
import type { Media, Pagina } from '@/payload-types'

import { Attachments } from '../Attachments/Attachments'
import { Documento } from '../Documento/Documento'
import { Fisarmonica } from '../Fisarmonica/Fisarmonica'
import { GuidaStudenti } from '../GuidaStudenti/GuidaStudenti'
import { IconaScuola } from '../IconaScuola/IconaScuola'
import { Planimetria } from '../Planimetria/Planimetria'

import styles from './Blocchi.module.css'

export type Blocco = NonNullable<Pagina['blocchi']>[number]

const media = (m: number | Media | null | undefined) =>
  m && typeof m === 'object' && m.url ? m : null

/** Immagine dei blocchi: col clic si apre ingrandita nel visualizzatore del sito. */
function Immagine({ m, didascalia }: { m: Media; didascalia?: string | null }) {
  const titolo = didascalia || m.alt || m.filename || 'Immagine'
  return (
    <figure className={styles.figure}>
      <a
        href={m.url!}
        className={styles.ingrandisci}
        aria-label={`Ingrandisci: ${m.alt || titolo}`}
        {...attributiFile(m.url!, { mimeType: m.mimeType, titolo, filename: m.filename })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- l'ottimizzazione arriva con lo storage su Drive */}
        <img
          src={m.url!}
          alt={m.alt ?? ''}
          width={m.width ?? undefined}
          height={m.height ?? undefined}
          loading="lazy"
          decoding="async"
        />
      </a>
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
      if (b.aspetto === 'fascia') {
        // Foto affiancate da bordo a bordo; al passaggio del mouse una si allarga e mostra il nome
        return (
          <section
            className={styles.fascia}
            aria-label={b.titolo ? undefined : 'Foto'}
            aria-labelledby={b.titolo ? `${id}-titolo` : undefined}
          >
            {b.titolo ? (
              <h2 id={`${id}-titolo`} className="visually-hidden">
                {b.titolo}
              </h2>
            ) : null}
            <ul>
              {b.immagini.map((im, k) => {
                const m = media(im.immagine)
                return m ? (
                  <li key={im.id ?? k}>
                    <figure>
                      {/* eslint-disable-next-line @next/next/no-img-element -- come le altre immagini dei blocchi */}
                      <img src={m.url!} alt={m.alt ?? ''} loading="lazy" decoding="async" />
                      {im.didascalia ? <figcaption>{im.didascalia}</figcaption> : null}
                    </figure>
                  </li>
                ) : null
              })}
            </ul>
          </section>
        )
      }
      return (
        <Sezione id={id} titolo={b.titolo}>
          <ul className={styles.galleria} data-anteprime="">
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
              const scuola = l.esterno ? null : slugScuolaDaLink(l.href)
              const contenuto = (
                <>
                  <span className={styles.linkNome}>
                    {scuola ? (
                      <IconaScuola scuola={scuola} size={32} className={styles.linkIcona} />
                    ) : null}
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

    case 'documento': {
      const f = media(b.file)
      if (!f) return null
      return (
        <div className={styles.blocco}>
          <Documento
            id={`${id}-titolo`}
            nome={b.nome}
            descrizione={b.descrizione}
            anteprima={b.anteprima}
            url={f.url!}
            filename={f.filename}
            mimeType={f.mimeType}
            filesize={f.filesize}
          />
        </div>
      )
    }

    case 'guidaStudenti':
      return (
        <Sezione id={id} titolo={b.titolo}>
          <GuidaStudenti livello={b.titolo ? 3 : 2} />
        </Sezione>
      )

    case 'planimetria':
      return (
        <div className={styles.blocco}>
          <Planimetria titolo={b.titolo || undefined} />
        </div>
      )

    case 'mappa': {
      const q = encodeURIComponent(b.indirizzo)
      const nome = b.nome || b.indirizzo
      return (
        <section className={styles.mappa} aria-label={`Mappa: ${nome}`}>
          <iframe
            title={`Mappa di Google: ${nome}, ${b.indirizzo}`}
            src={`https://maps.google.com/maps?q=${q}&t=m&z=16&output=embed&iwloc=near`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="container">
            <p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apri in Google Maps
                <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden className={styles.esterno} />
                <span className="visually-hidden"> (si apre in una nuova scheda)</span>
              </a>
            </p>
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

/** Blocchi che escono dalla colonna del testo e vanno da bordo a bordo, in fondo alla pagina. */
export const aTuttaLarghezza = (b: Blocco) =>
  b.blockType === 'mappa' || (b.blockType === 'galleria' && b.aspetto === 'fascia')

/** Contenuto di una pagina composta a blocchi dal pannello. */
export function Blocchi({
  blocchi,
  variante,
}: {
  blocchi: Blocco[] | null | undefined
  /**
   * "scheda": blocchi stretti in colonna laterale (es. contatti), con filetto rosso.
   * "piena": blocchi a tutta larghezza (fascia di foto, mappa), uno sotto l'altro senza spazi.
   */
  variante?: 'scheda' | 'piena'
}) {
  if (!blocchi?.length) return null
  const classe = variante === 'scheda' ? styles.scheda : variante === 'piena' ? styles.piene : ''
  return (
    <div className={`${styles.blocchi} ${classe}`}>
      {blocchi.map((b, i) => (
        <RenderBlocco key={b.id ?? i} b={b} i={i} />
      ))}
    </div>
  )
}
