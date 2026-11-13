import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Alert, Breadcrumbs, StampaPagina, TestataPagina } from '@/components'
import {
  COLONNE,
  TIPO_LABELS,
  campateRighe,
  corrisponde,
  normalizzaRighe,
  valoriFiltro,
  type Riga,
} from '@/lib/calendari'
import { trovaCalendario } from '@/lib/calendari-dati'
import type { Media } from '@/payload-types'

import { NUOVA_SCHEDA } from '@/utilities/pdf'

import styles from './calendario.module.css'

export const dynamic = 'force-dynamic'

/** I link (es. Google Meet) scritti nelle celle diventano cliccabili. */
function ConLink({ testo }: { testo: string }) {
  const parti = testo.split(/((?:https?:\/\/)?meet\.google\.com\/[\w-]+|https?:\/\/[^\s]+)/g)
  return parti.map((p, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={p.startsWith('http') ? p : `https://${p}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {p.replace(/^https?:\/\//, '')}
        <span className="visually-hidden"> (si apre in una nuova scheda)</span>
      </a>
    ) : (
      p
    ),
  )
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const primo = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

const dataIt = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  }).format(new Date(iso))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trovato = await trovaCalendario((await params).slug)
  if (!trovato) return { title: 'Calendario non trovato' }
  const { calendario: c, bozza } = trovato
  const titolo = [c.titolo, c.sottotitolo, `A.A. ${c.annoAccademico}`].filter(Boolean).join(' · ')
  return {
    title: titolo,
    description: `${TIPO_LABELS[c.tipo]} dell’Accademia Albertina, A.A. ${c.annoAccademico}: consultabile e stampabile.`,
    alternates: { canonical: `/calendari/${c.slug}` },
    robots: bozza ? { index: false } : undefined,
  }
}

export default async function CalendarioPage({ params, searchParams }: Props) {
  const trovato = await trovaCalendario((await params).slug)
  if (!trovato) notFound()
  const { calendario: c, bozza } = trovato
  const sp = await searchParams

  const colonne = COLONNE[c.tipo]
  const tutte = normalizzaRighe(c.tipo, c.righe)
  const filtri = colonne.filter((col) => col.filtro)
  const q = primo(sp.q).slice(0, 80)
  const scelti = Object.fromEntries(filtri.map((f) => [f.chiave, primo(sp[f.chiave]).slice(0, 60)]))
  const filtrato = Boolean(q) || Object.values(scelti).some(Boolean)

  const qq = q.toLowerCase()
  const righe = tutte.filter(
    (r) =>
      filtri.every((f) => corrisponde(r, f.chiave, scelti[f.chiave])) &&
      (!qq || Object.values(r).some((v) => v.toLowerCase().includes(qq))),
  )
  const span = campateRighe(righe, colonne, c.tipo === 'presentazioni' ? 1 : 3)

  // Da telefono: una scheda per ogni valore della prima colonna (il corso, il docente…).
  const gruppi: { titolo: string; righe: Riga[] }[] = []
  for (const r of righe) {
    const t = r[colonne[0].chiave]
    const ultimo = gruppi.at(-1)
    if (ultimo && ultimo.titolo === t) ultimo.righe.push(r)
    else gruppi.push({ titolo: t, righe: [r] })
  }

  const pdf = typeof c.pdf === 'object' ? (c.pdf as Media | null) : null
  const avvertenze = (c.avvertenze ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const sedi = (c.sedi ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className={`container ${styles.page}`}>
      <div className="non-stampare">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Orari e calendari', href: '/calendari' },
            { label: c.titolo },
          ]}
        />
      </div>
      {bozza ? (
        <Alert tone="warning" title="Anteprima">
          Stai vedendo una bozza: il pubblico vede ancora l’ultima versione pubblicata.
        </Alert>
      ) : null}

      <TestataPagina
        occhiello={`A.A. ${c.annoAccademico}`}
        titolo={c.titolo}
        sommario={c.sottotitolo}
      >
        <div className={styles.meta}>
          <p className={styles.aggiornato}>
            Ultimo aggiornamento: <time dateTime={c.updatedAt}>{dataIt(c.updatedAt)}</time>
          </p>
          <div className={`${styles.azioni} non-stampare`}>
            <StampaPagina />
            {pdf?.url ? (
              <a href={pdf.url} className="btn btn-secondario" target="_blank" rel="noopener">
                <Download size={18} strokeWidth={1.75} aria-hidden /> Apri il PDF
                <span className="visually-hidden">{NUOVA_SCHEDA}</span>
              </a>
            ) : null}
          </div>
        </div>
      </TestataPagina>

      {sedi.length > 0 ? (
        <ul className={styles.sedi} aria-label="Sedi">
          {sedi.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}

      {avvertenze.length > 0 ? (
        <div className={styles.avvertenze}>
          <Alert tone="warning" title="Attenzione">
            {avvertenze.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </Alert>
        </div>
      ) : null}

      <form
        method="get"
        className={`${styles.filtri} non-stampare`}
        role="search"
        style={{ ['--filtri' as string]: filtri.length }}
      >
        <div className={`${styles.campo} ${styles.campoLargo}`}>
          <label htmlFor="cal-q">Cerca</label>
          <input
            id="cal-q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={80}
            autoComplete="off"
            placeholder={
              c.tipo === 'presentazioni' ? 'Scuola, docente, aula…' : 'Corso, docente, aula…'
            }
          />
        </div>
        {filtri.map((f) => (
          <div key={f.chiave} className={styles.campo}>
            <label htmlFor={`cal-${f.chiave}`}>{f.etichetta}</label>
            <select id={`cal-${f.chiave}`} name={f.chiave} defaultValue={scelti[f.chiave]}>
              <option value="">Tutti</option>
              {valoriFiltro(tutte, f.chiave).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit" className="btn btn-primario">
          Filtra
        </button>
      </form>

      <p className={`${styles.conta} non-stampare`} role="status">
        {righe.length === 1 ? '1 riga' : `${righe.length} righe`}
        {filtrato ? ` su ${tutte.length}` : ''}
        {filtrato ? (
          <>
            {' · '}
            <Link href={`/calendari/${c.slug}`}>Togli i filtri</Link>
          </>
        ) : null}
      </p>

      {righe.length === 0 ? (
        <p className={styles.vuoto}>
          {tutte.length === 0
            ? 'La tabella non è ancora stata compilata.'
            : 'Nessuna riga corrisponde ai filtri scelti.'}
        </p>
      ) : (
        <>
          <div className={styles.scorri}>
            <table className={styles.tabella}>
              <caption className="visually-hidden">
                {c.titolo}, A.A. {c.annoAccademico}
              </caption>
              <thead>
                <tr>
                  {colonne.map((col) => (
                    <th key={col.chiave} scope="col">
                      {col.etichetta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {righe.map((r, i) => (
                  <tr key={i} data-inizio-gruppo={span[i][0] > 0 ? true : undefined}>
                    {colonne.map((col, k) =>
                      span[i][k] === 0 ? null : k === 0 ? (
                        <th key={col.chiave} scope="row" rowSpan={span[i][k]}>
                          {r[col.chiave]}
                        </th>
                      ) : (
                        <td key={col.chiave} rowSpan={span[i][k]}>
                          <ConLink testo={r[col.chiave]} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.schede} aria-label={c.titolo}>
            {gruppi.map((g, i) => (
              <li key={i} className={styles.scheda}>
                <p className={styles.schedaTitolo}>{g.titolo || '—'}</p>
                <ul>
                  {g.righe.map((r, k) => (
                    <li key={k}>
                      <dl>
                        {colonne.slice(1).map((col) =>
                          r[col.chiave] ? (
                            <div key={col.chiave}>
                              <dt>{col.etichetta}</dt>
                              <dd>
                                <ConLink testo={r[col.chiave]} />
                              </dd>
                            </div>
                          ) : null,
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
