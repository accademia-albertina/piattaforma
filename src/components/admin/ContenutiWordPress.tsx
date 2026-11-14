/**
 * Sezione "Contenuti dal sito WordPress" di /admin/drive: sincronizzazione di Albo online,
 * Amministrazione trasparente e avvisi (src/lib/wp-import/contenuti/). Solo presentazione;
 * pulsanti come semplici moduli POST, funzionano anche senza JavaScript.
 */
import type {
  EsitoRaccolta,
  Raccolta,
  StatoContenuti,
} from '@/lib/wp-import/contenuti/sincronizza-contenuti'

import styles from './Drive.module.css'

export type PropsContenutiWordPress = {
  stato: StatoContenuti
  /** Contenuti già collegati a WordPress, per raccolta. */
  collegati: Record<Raccolta, number>
  attivo: boolean
}

const NOMI: Record<Raccolta, string> = {
  albo: 'Albo online',
  trasparenza: 'Amministrazione trasparente',
  avvisi: 'Avvisi',
}

const FASI: Record<StatoContenuti['fase'], string> = {
  albo: 'Albo online',
  trasparenza: 'Amministrazione trasparente',
  avvisi: 'Avvisi',
  pagine: 'Controllo delle pagine',
  finito: '',
}

const numero = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const data = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Rome',
})

/** "Titolo (/admin/collections/albo/12)" → link al contenuto nel pannello. */
function Voce({ testo }: { testo: string }) {
  const m = /^(.*) \((\/admin\/collections\/[\w-]+\/\d+)\)$/.exec(testo)
  return <li>{m ? <a href={m[2]}>{m[1]}</a> : testo}</li>
}

function Esito({ nome, e }: { nome: string; e: EsitoRaccolta }) {
  return (
    <>
      <h4>{nome}</h4>
      <ul>
        <li>
          {numero(e.suWordPress)} su WordPress: {numero(e.nuovi)} nuovi, {numero(e.aggiornati)}{' '}
          aggiornati, {numero(e.invariati)} già allineati
          {e.protetti > 0 && `, ${numero(e.protetti)} modificati nel pannello (non toccati)`}.
        </li>
        {e.collegati > 0 && (
          <li>{numero(e.collegati)} contenuti dell’importazione iniziale collegati a WordPress.</li>
        )}
      </ul>
      {e.daControllare.length > 0 && (
        <details>
          <summary>
            {numero(e.daControllare.length)} cambiati su WordPress ma modificati anche qui: da
            controllare a mano
          </summary>
          <ul className={styles.elenco}>
            {e.daControllare.map((t) => (
              <Voce key={t} testo={t} />
            ))}
          </ul>
        </details>
      )}
      {e.nonPiuSuWpTotale > 0 && (
        <details>
          <summary>{numero(e.nonPiuSuWpTotale)} non ci sono più su WordPress (restano qui)</summary>
          <ul className={styles.elenco}>
            {e.nonPiuSuWp.map((t) => (
              <Voce key={t} testo={t} />
            ))}
          </ul>
        </details>
      )}
      {e.errori.length > 0 && (
        <details>
          <summary>{numero(e.errori.length)} non importati (rilancia per riprovare)</summary>
          <ul className={styles.elenco}>
            {e.errori.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

export default function ContenutiWordPress({
  stato: s,
  collegati,
  attivo,
}: PropsContenutiWordPress) {
  return (
    <section aria-labelledby="contenuti-wordpress" className={styles.scheda}>
      <h2 id="contenuti-wordpress">Contenuti dal sito WordPress</h2>
      <p>
        Allinea Albo online, Amministrazione trasparente e avvisi a albertina-academy.it: aggiunge i
        nuovi, aggiorna quelli cambiati su WordPress e importa i file collegati. Non tocca i
        contenuti modificati nel pannello e non cancella nulla. Rilanciala quando vuoi, fino al
        passaggio al nuovo sito.
      </p>
      <dl className={styles.dati}>
        {(Object.keys(NOMI) as Raccolta[]).map((r) => (
          <div key={r} style={{ display: 'contents' }}>
            <dt>{NOMI[r]}</dt>
            <dd>{numero(collegati[r])} collegati a WordPress</dd>
          </div>
        ))}
      </dl>

      {s.inCorso ? (
        <>
          <p role="status">
            {FASI[s.fase]}
            {s.daFare > 0 ? `: ${numero(s.fatti)} di ${numero(s.daFare)} da aggiornare.` : '…'}{' '}
            Ricarica la pagina per aggiornare.
          </p>
          <form method="post" action="/api/wp-import/contenuti/ferma" className={styles.azioni}>
            <button type="submit" className={styles.secondario}>
              Ferma
            </button>
          </form>
        </>
      ) : (
        attivo && (
          <div className={styles.azioni}>
            <form method="post" action="/api/wp-import/contenuti/avvia">
              <button type="submit" className={styles.primario}>
                Sincronizza i contenuti
              </button>
            </form>
            <form method="post" action="/api/wp-import/contenuti/avvia">
              <input type="hidden" name="limite" value="5" />
              <button type="submit" className={styles.secondario}>
                Prova con 5 per tipo
              </button>
            </form>
          </div>
        )
      )}

      {s.finitoIl && !s.inCorso && (
        <div className={styles.esitoWp}>
          <h3>
            Ultima sincronizzazione · {data.format(new Date(s.finitoIl))}
            {s.limite ? ` (prova, al massimo ${s.limite} per tipo)` : ''}
          </h3>
          {(Object.keys(NOMI) as Raccolta[]).map((r) => (
            <Esito key={r} nome={NOMI[r]} e={s[r]} />
          ))}
          {s.fileImportati > 0 && (
            <p>{numero(s.fileImportati)} file nuovi importati da WordPress.</p>
          )}
          {s.pagineModificate.length > 0 && (
            <details>
              <summary>
                {numero(s.pagineModificate.length)} pagine modificate su WordPress dopo
                l’importazione: da riportare a mano
              </summary>
              <ul className={styles.elenco}>
                {s.pagineModificate.map((p) => (
                  <li key={p.url}>
                    <a href={p.url}>{p.titolo}</a> · {data.format(new Date(p.modificato))}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {s.errori.length > 0 && (
            <ul className={styles.elenco}>
              {s.errori.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
