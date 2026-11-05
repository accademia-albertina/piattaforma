import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs, TestataPagina } from '@/components'
import { SEZIONI_TRASPARENZA } from '@/lib/albo'
import { elencoTrasparenza } from '@/lib/albo-dati'

import styles from '../albo/albo.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Amministrazione trasparente',
  description:
    'Amministrazione trasparente dell’Accademia Albertina: organizzazione, personale, bandi, bilanci e le altre informazioni previste dal D.Lgs. 33/2013.',
  alternates: { canonical: '/amministrazione-trasparente' },
}

const idSezione = (s: string) =>
  `sez-${s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

export default async function TrasparenzaPage() {
  const voci = await elencoTrasparenza()
  const sezioni = SEZIONI_TRASPARENZA.map((sezione) => ({
    sezione,
    voci: voci.filter((v) => v.sezione === sezione),
  })).filter((s) => s.voci.length > 0)

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Amministrazione trasparente' }]}
      />
      <TestataPagina
        occhiello="Accademia"
        titolo="Amministrazione trasparente"
        sommario="Le informazioni sull’organizzazione e sull’attività dell’Accademia, ordinate come prevede il D.Lgs. 33/2013."
      />

      {sezioni.length === 0 ? (
        <p className={styles.vuoto}>Non ci sono ancora sottosezioni pubblicate.</p>
      ) : (
        <div className={styles.indice}>
          {sezioni.map((s) => (
            <section key={s.sezione} aria-labelledby={idSezione(s.sezione)}>
              <h2 id={idSezione(s.sezione)}>{s.sezione}</h2>
              <ul>
                {s.voci.map((v) => (
                  <li key={v.id}>
                    <Link href={`/amministrazione-trasparente/${v.slug}`}>{v.titolo}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
